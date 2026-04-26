const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    boardedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startLocation: { latitude: Number, longitude: Number },
    endLocation: { latitude: Number, longitude: Number },
    distance: { type: Number, default: 0 }, // km
    locationHistory: [{
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        speed: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now }
    }],
    speedingAlerts: { type: Number, default: 0 },
    isDelayed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

tripSchema.index({ busId: 1, status: 1 });
tripSchema.index({ driverId: 1, startTime: -1 });

module.exports = mongoose.model('Trip', tripSchema);
