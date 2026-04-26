const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

// TTL index – auto-delete location pings older than 24 hours
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });
locationSchema.index({ busId: 1, timestamp: -1 });

module.exports = mongoose.model('Location', locationSchema);
