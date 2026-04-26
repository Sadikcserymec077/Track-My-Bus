const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    title: { type: String, default: 'BusTrack Notification' },
    type: {
        type: String,
        enum: ['trip_start', 'trip_stop', 'delay', 'sos', 'reminder', 'geofence', 'general'],
        default: 'general'
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    broadcastToRole: { type: String, enum: ['admin', 'driver', 'student', 'all', null], default: null },
    createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
