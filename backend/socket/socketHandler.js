const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = (io) => {
    // Auth middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Authentication required'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`Socket connected: ${user.name} [${user.role}]`);

        // Join role room
        socket.join(`role-${user.role}`);
        socket.join(`user-${user._id}`);

        if (user.role === 'admin') socket.join('admin-room');
        if (user.assignedBusId) socket.join(`bus-${user.assignedBusId}`);

        // ── Driver: location update ─────────────────────────────────────
        socket.on('send-location', async (data) => {
            try {
                const { latitude, longitude, speed, heading } = data;
                const busId = user.assignedBusId;
                if (!busId) return;

                const payloadTimestamp = data.timestamp ? new Date(data.timestamp) : new Date();

                // Update bus current location in DB
                await Bus.findByIdAndUpdate(busId, {
                    'currentLocation.latitude': latitude,
                    'currentLocation.longitude': longitude,
                    'currentLocation.updatedAt': payloadTimestamp
                });

                // Update Trip history and speed alerts
                const update = {
                    $push: { locationHistory: { latitude, longitude, speed, timestamp: payloadTimestamp } }
                };
                // Assuming speed is in km/h based on Geolocation API converting to km/h (raw is m/s, so speed * 3.6)
                const speedKmH = speed ? (speed * 3.6) : 0;
                if (speedKmH > 60) {
                    update.$inc = { speedingAlerts: 1 };
                }
                await Trip.updateOne({ busId, driverId: user._id, status: 'active' }, update);

                const payload = { busId, latitude, longitude, speed: speedKmH, heading, timestamp: new Date() };

                // Broadcast to bus room & admin
                socket.to(`bus-${busId}`).emit('location-update', payload);
                socket.to('admin-room').emit('location-update', payload);

                // Geofencing: within 150m of a stop
                const bus = await Bus.findById(busId).select('stops busNumber');
                if (bus && bus.stops && bus.stops.length > 0) {
                    for (const stop of bus.stops) {
                        if (!stop.latitude || !stop.longitude) continue;
                        const dist = haversine(latitude, longitude, stop.latitude, stop.longitude);
                        if (dist <= 0.15) {
                            io.to(`bus-${busId}`).emit('approaching-stop', {
                                stopName: stop.name,
                                distance: Math.round(dist * 1000)
                            });
                            const notif = new Notification({
                                title: 'Bus Approaching Stop',
                                message: `Bus ${bus.busNumber} is approaching ${stop.name}`,
                                type: 'geofence',
                                busId,
                                broadcastToRole: 'student'
                            });
                            await notif.save().catch(() => { }); // non-fatal
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error('socket send-location error:', err.message);
            }
        });

        // ── Driver: trip events ─────────────────────────────────────────
        socket.on('trip-started', (data) => {
            if (user.role !== 'driver') return;
            socket.to(`bus-${user.assignedBusId}`).emit('trip-started', data);
            socket.to('admin-room').emit('trip-started', data);
        });

        socket.on('trip-stopped', (data) => {
            if (user.role !== 'driver') return;
            socket.to(`bus-${user.assignedBusId}`).emit('trip-stopped', data);
            socket.to('admin-room').emit('trip-stopped', data);
        });

        // ── SOS Alert ───────────────────────────────────────────────────
        socket.on('sos', (data) => {
            const payload = { ...data, driverName: user.name, driverId: user._id, timestamp: new Date() };
            io.to('admin-room').emit('sos-alert', payload);
        });

        // ── Student joins a specific bus room & tracks boarding ──────────
        socket.on('join-bus', (busId) => {
            socket.join(`bus-${busId}`);
        });

        socket.on('student-location', async (data) => {
            if (user.role !== 'student') return;
            const { latitude, longitude, busId } = data;
            if (!latitude || !longitude || !busId) return;

            try {
                const bus = await Bus.findById(busId);
                if (!bus || !bus.currentLocation || !bus.currentLocation.latitude) return;

                const dist = haversine(latitude, longitude, bus.currentLocation.latitude, bus.currentLocation.longitude);
                if (dist <= 0.05) { // 50 meters
                    const activeTrip = await Trip.findOne({ busId, status: 'active' });
                    if (activeTrip) {
                        const alreadyOnboarded = activeTrip.boardedStudents.includes(user._id);
                        if (!alreadyOnboarded) {
                            await Trip.updateOne(
                                { _id: activeTrip._id },
                                { $addToSet: { boardedStudents: user._id } }
                            );
                            socket.emit('student-onboarded', { busId });
                        }
                    }
                }
            } catch (err) {
                console.error('socket student-location error:', err.message);
            }
        });

        // ── Disconnect ──────────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${user.name} [${user.role}]`);
        });

        // ── Catch all unhandled socket errors ───────────────────────────
        socket.on('error', (err) => {
            console.error(`Socket error [${user.name}]:`, err.message);
        });
    });
};
