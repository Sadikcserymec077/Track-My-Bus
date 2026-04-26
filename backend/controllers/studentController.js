const Bus = require('../models/Bus');
const User = require('../models/User');
const Location = require('../models/Location');
const Notification = require('../models/Notification');

// GET /api/student/my-bus
exports.getMyBus = async (req, res) => {
    try {
        let busId = req.user.assignedBusId;

        if (req.user.role === 'parent') {
            if (!req.user.childStudentId) return res.status(400).json({ success: false, message: 'No child linked to this parent account.' });
            const child = await User.findById(req.user.childStudentId);
            if (!child) return res.status(404).json({ success: false, message: 'Linked child account not found.' });
            busId = child.assignedBusId;
        }

        if (!busId) return res.status(404).json({ success: false, message: 'No bus assigned.' });

        const bus = await Bus.findById(busId).populate('driverId', 'name phone');
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

        res.json({ success: true, data: bus });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/student/track-bus/:busId
exports.trackBus = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.busId)
            .select('busNumber currentLocation isActive route stops driverId')
            .populate('driverId', 'name phone');
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
        res.json({ success: true, data: bus });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/student/all-bus-locations
exports.getAllBusLocations = async (req, res) => {
    try {
        const buses = await Bus.find({ institution: req.user.institution, isActive: true })
            .select('busNumber currentLocation route driverId')
            .populate('driverId', 'name');
        res.json({ success: true, data: buses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/student/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifs = await Notification.find({
            $or: [
                { recipientId: req.user._id },
                { broadcastToRole: 'student' },
                { broadcastToRole: 'all' }
            ]
        }).sort({ createdAt: -1 }).limit(30);
        res.json({ success: true, data: notifs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/student/notifications/:id/read
exports.markRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { status: 'read' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/student/sos
exports.sos = async (req, res) => {
    try {
        const { latitude, longitude, message } = req.body;
        const busId = req.user.assignedBusId;

        const notif = new Notification({
            title: '🚨 STUDENT SOS ALERT',
            message: message || `Student ${req.user.name} needs help! Location: (${latitude}, ${longitude})`,
            type: 'sos',
            senderId: req.user._id,
            busId,
            broadcastToRole: 'admin'
        });
        await notif.save();

        if (req.io) {
            req.io.to('admin-room').emit('sos-alert', {
                driverName: `Student: ${req.user.name}`, // Reuse driverName payload for admin UI compatibility
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
