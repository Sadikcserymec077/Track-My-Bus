const User = require('../models/User');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const [totalBuses, totalDrivers, totalStudents, activeTrips] = await Promise.all([
            Bus.countDocuments({ institution: req.user.institution }),
            User.countDocuments({ role: 'driver', institution: req.user.institution }),
            User.countDocuments({ role: 'student', institution: req.user.institution }),
            Trip.countDocuments({ status: 'active' })
        ]);
        res.json({ success: true, data: { totalBuses, totalDrivers, totalStudents, activeTrips } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DRIVERS ──────────────────────────────────────────────────────────────────
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver', institution: req.user.institution })
            .select('-password').populate('assignedBusId', 'busNumber route');
        res.json({ success: true, data: drivers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createDriver = async (req, res) => {
    try {
        const { name, phone, registrationId, password } = req.body;
        if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password are required.' });
        if (!phone && !registrationId) return res.status(400).json({ success: false, message: 'Phone or Registration ID is required.' });
        const driver = new User({
            name, phone, registrationId, password, role: 'driver',
            institution: req.user.institution, isFirstLogin: true
        });
        await driver.save();
        res.status(201).json({ success: true, message: 'Driver created.', data: { _id: driver._id, name: driver.name } });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'A driver with this phone or ID already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const { name, phone, registrationId, password } = req.body;
        const driver = await User.findOne({ _id: req.params.id, role: 'driver' });
        if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
        if (name) driver.name = name;
        if (phone) driver.phone = phone;
        if (registrationId) driver.registrationId = registrationId;
        if (password) { driver.password = password; driver.isFirstLogin = true; }
        await driver.save();
        res.json({ success: true, message: 'Driver updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const driver = await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
        if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
        // Unassign from bus
        await Bus.updateMany({ driverId: req.params.id }, { $set: { driverId: null } });
        res.json({ success: true, message: 'Driver deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student', institution: req.user.institution })
            .select('-password').populate('assignedBusId', 'busNumber route');
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { name, phone, registrationId, password } = req.body;
        if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password are required.' });
        if (!phone && !registrationId) return res.status(400).json({ success: false, message: 'Phone or Registration ID is required.' });
        const student = new User({
            name, phone, registrationId, password, role: 'student',
            institution: req.user.institution
        });
        await student.save();
        res.status(201).json({ success: true, message: 'Student created.', data: { _id: student._id, name: student.name } });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'A student with this phone or ID already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const updateData = {};
        const allowed = ['name', 'phone', 'registrationId'];
        allowed.forEach(f => { if (req.body[f]) updateData[f] = req.body[f]; });
        if (req.body.password) {
            const student = await User.findById(req.params.id);
            if (student) { student.password = req.body.password; await student.save(); }
        }
        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true, message: 'Student updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
        await Bus.updateMany({ studentIds: req.params.id }, { $pull: { studentIds: req.params.id } });
        res.json({ success: true, message: 'Student deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── BUSES ────────────────────────────────────────────────────────────────────
exports.getAllBuses = async (req, res) => {
    try {
        const buses = await Bus.find({ institution: req.user.institution })
            .populate('driverId', 'name phone')
            .populate('studentIds', 'name phone registrationId');
        res.json({ success: true, data: buses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createBus = async (req, res) => {
    try {
        const { busNumber, route, stops } = req.body;
        if (!busNumber) return res.status(400).json({ success: false, message: 'Bus number is required.' });
        // Check duplicate
        const existing = await Bus.findOne({ busNumber: busNumber.trim() });
        if (existing) return res.status(409).json({ success: false, message: `Bus number "${busNumber}" already exists. Please use a different number.` });
        const bus = new Bus({ busNumber: busNumber.trim(), route, stops: stops || [], institution: req.user.institution });
        await bus.save();
        res.status(201).json({ success: true, message: 'Bus created.', data: bus });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'Bus number already exists.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateBus = async (req, res) => {
    try {
        const { busNumber, route, stops } = req.body;
        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            { busNumber, route, stops: stops || [] },
            { new: true }
        );
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
        res.json({ success: true, message: 'Bus updated.', data: bus });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteBus = async (req, res) => {
    try {
        const bus = await Bus.findByIdAndDelete(req.params.id);
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
        await User.updateMany({ assignedBusId: req.params.id }, { $set: { assignedBusId: null } });
        res.json({ success: true, message: 'Bus deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ASSIGN ───────────────────────────────────────────────────────────────────
exports.assignDriverToBus = async (req, res) => {
    try {
        const { busId, driverId } = req.body;
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
        // Remove old driver's assignment
        if (bus.driverId) {
            await User.findByIdAndUpdate(bus.driverId, { assignedBusId: null });
        }
        bus.driverId = driverId;
        await bus.save();
        await User.findByIdAndUpdate(driverId, { assignedBusId: busId });
        res.json({ success: true, message: 'Driver assigned to bus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.assignStudentToBus = async (req, res) => {
    try {
        const { busId, studentId } = req.body;
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
        if (!bus.studentIds.includes(studentId)) {
            bus.studentIds.push(studentId);
            await bus.save();
        }
        await User.findByIdAndUpdate(studentId, { assignedBusId: busId });
        res.json({ success: true, message: 'Student assigned to bus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.removeStudentFromBus = async (req, res) => {
    try {
        const { busId, studentId } = req.body;
        await Bus.findByIdAndUpdate(busId, { $pull: { studentIds: studentId } });
        await User.findByIdAndUpdate(studentId, { assignedBusId: null });
        res.json({ success: true, message: 'Student removed from bus.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/live-locations
exports.getLiveLocations = async (req, res) => {
    try {
        const buses = await Bus.find({ institution: req.user.institution, isActive: true })
            .select('busNumber currentLocation route driverId')
            .populate('driverId', 'name');
        res.json({ success: true, data: buses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/trip-history
exports.getTripHistory = async (req, res) => {
    try {
        const trips = await Trip.find()
            .populate('busId', 'busNumber')
            .populate('driverId', 'name')
            .sort({ startTime: -1 })
            .limit(50);
        res.json({ success: true, data: trips });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/send-notification
exports.sendNotification = async (req, res) => {
    try {
        const { message, title, type, recipientId, broadcastToRole, busId } = req.body;
        const notif = new Notification({
            message, title, type, busId,
            senderId: req.user._id,
            recipientId: recipientId || null,
            broadcastToRole: broadcastToRole || null
        });
        await notif.save();

        // Emit through socket if available
        if (req.io) {
            if (broadcastToRole) {
                req.io.to(`role-${broadcastToRole}`).emit('notification', { title, message, type });
            } else if (recipientId) {
                req.io.to(`user-${recipientId}`).emit('notification', { title, message, type });
            }
        }

        res.json({ success: true, message: 'Notification sent.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
