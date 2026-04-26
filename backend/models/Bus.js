const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
    name: String,
    latitude: Number,
    longitude: Number,
    order: Number
});

const busSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true, trim: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    route: { type: String, default: '' },
    scheduledMorningStart: { type: String, default: '08:00' },
    stops: [stopSchema],
    isActive: { type: Boolean, default: false },
    institution: { type: String, default: 'default' },
    currentLocation: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        updatedAt: { type: Date, default: null }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);
