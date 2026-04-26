const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Location = require('../models/Location');
const Notification = require('../models/Notification');

// POST /api/driver/start-trip
exports.startTrip = async (req, res) => {
    try {
        const bus = await Bus.findById(req.user.assignedBusId);
        if (!bus) return res.status(404).json({ success: false, message: 'No bus assigned.' });

        // End any existing active trip for this bus
        await Trip.updateMany(
            { busId: bus._id, status: 'active' },
            { status: 'cancelled', endTime: new Date() }
        );

        // Check for delay
        const now = new Date();
        const [h, m] = (bus.scheduledMorningStart || '08:00').split(':').map(Number);
        let isDelayed = false;

        // Only flag delay for morning trips (before noon)
        if (now.getHours() < 12) {
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const scheduledMins = h * 60 + m;
            if (currentMins > scheduledMins + 15) isDelayed = true;
        }

        const trip = new Trip({
            busId: bus._id,
            driverId: req.user._id,
            startLocation: req.body.startLocation || {},
            isDelayed,
            startTime: now
        });
        await trip.save();

        bus.isActive = true;
        await bus.save();

        // Notify students via socket
        if (req.io) {
            req.io.to(`bus-${bus._id}`).emit('trip-started', {
                busId: bus._id,
                busNumber: bus.busNumber,
                driverName: req.user.name,
                startTime: trip.startTime
            });
            // Save notification
            const notif = new Notification({
                title: isDelayed ? 'Delayed Trip Started' : 'Trip Started',
                message: `Bus ${bus.busNumber} has started ${isDelayed ? '(delayed)' : 'on time'}. Your bus is on the way!`,
                type: isDelayed ? 'delay' : 'trip_start',
                busId: bus._id,
                broadcastToRole: 'student'
            });
            await notif.save();
        }

        res.json({ success: true, message: 'Trip started.', tripId: trip._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/driver/send-location
exports.sendLocation = async (req, res) => {
    try {
        const { latitude, longitude, speed, heading } = req.body;
        const busId = req.user.assignedBusId;
        if (!busId) return res.status(400).json({ success: false, message: 'No bus assigned.' });

        // Save location log
        const loc = new Location({ busId, latitude, longitude, speed: speed || 0, heading: heading || 0 });
        await loc.save();

        // Update bus current location
        await Bus.findByIdAndUpdate(busId, {
            'currentLocation.latitude': latitude,
            'currentLocation.longitude': longitude,
            'currentLocation.updatedAt': new Date()
        });

        // Broadcast via socket
        if (req.io) {
            req.io.to(`bus-${busId}`).emit('location-update', {
                busId, latitude, longitude, speed, heading, timestamp: loc.timestamp
            });
            req.io.to('admin-room').emit('location-update', {
                busId, latitude, longitude, speed, heading, timestamp: loc.timestamp
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/driver/stop-trip
exports.stopTrip = async (req, res) => {
    try {
        const busId = req.user.assignedBusId;
        const trip = await Trip.findOneAndUpdate(
            { busId, driverId: req.user._id, status: 'active' },
            { status: 'completed', endTime: new Date(), endLocation: req.body.endLocation || {} },
            { new: true }
        );

        await Bus.findByIdAndUpdate(busId, {
            isActive: false,
            'currentLocation.latitude': null,
            'currentLocation.longitude': null
        });

        if (req.io) {
            const bus = await Bus.findById(busId);
            req.io.to(`bus-${busId}`).emit('trip-stopped', { busId, busNumber: bus?.busNumber });
            req.io.to('admin-room').emit('trip-stopped', { busId });
        }

        res.json({ success: true, message: 'Trip stopped.', trip });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/driver/my-bus
exports.getMyBus = async (req, res) => {
    try {
        const bus = await Bus.findById(req.user.assignedBusId)
            .populate('studentIds', 'name phone registrationId');
        if (!bus) return res.status(404).json({ success: false, message: 'No bus assigned.' });
        res.json({ success: true, data: bus });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/driver/sos
exports.sos = async (req, res) => {
    try {
        const { latitude, longitude, message } = req.body;
        const busId = req.user.assignedBusId;

        const notif = new Notification({
            title: '🚨 SOS ALERT',
            message: message || `Driver ${req.user.name} needs help! Bus at (${latitude}, ${longitude})`,
            type: 'sos',
            senderId: req.user._id,
            busId,
            broadcastToRole: 'admin'
        });
        await notif.save();

        if (req.io) {
            req.io.to('admin-room').emit('sos-alert', {
                driverName: req.user.name,
                busId, latitude, longitude,
                message: notif.message,
                timestamp: new Date()
            });
        }
        res.json({ success: true, message: 'SOS sent to admin.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/driver/board-student
exports.boardStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const busId = req.user.assignedBusId;
        await Trip.findOneAndUpdate(
            { busId, status: 'active' },
            { $addToSet: { boardedStudents: studentId } }
        );
        res.json({ success: true, message: 'Student marked as boarded.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/driver/trip-history
exports.getTripHistory = async (req, res) => {
    try {
        const trips = await Trip.find({ driverId: req.user._id })
            .populate('busId', 'busNumber')
            .sort({ startTime: -1 })
            .limit(20);
        res.json({ success: true, data: trips });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
