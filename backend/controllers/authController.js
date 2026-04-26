const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
        }

        // Find by phone, registrationId, or email
        const user = await User.findOne({
            $or: [
                { phone: identifier },
                { registrationId: identifier },
                { email: identifier }
            ]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = signToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                phone: user.phone,
                registrationId: user.registrationId,
                assignedBusId: user.assignedBusId,
                childStudentId: user.childStudentId,
                isFirstLogin: user.isFirstLogin
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/create-user  (admin only)
exports.createUser = async (req, res) => {
    try {
        const { name, phone, registrationId, email, password, role, assignedBusId } = req.body;
        if (!name || !password || !role) {
            return res.status(400).json({ success: false, message: 'name, password and role are required.' });
        }

        const user = new User({
            name, phone, registrationId, email, password, role,
            assignedBusId: assignedBusId || null,
            institution: req.user.institution || 'default',
            isFirstLogin: role === 'driver' ? true : false
        });
        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully.',
            user: { _id: user._id, name: user.name, role: user.role }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'User with this identifier already exists.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/register-parent
exports.registerParent = async (req, res) => {
    try {
        const { name, phone, password, studentRegistrationId } = req.body;
        if (!name || !phone || !password || !studentRegistrationId) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const student = await User.findOne({ registrationId: studentRegistrationId, role: 'student' });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student with this Registration ID not found.' });
        }

        const parent = new User({
            name, phone, password, role: 'parent', childStudentId: student._id
        });
        await parent.save();

        res.status(201).json({ success: true, message: 'Parent account created! You can now login.' });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'Phone number already registered.' });
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/auth/fcm-token
exports.updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        await User.findByIdAndUpdate(req.user._id, { fcmToken });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updates = {};
        if (name) updates.name = name.trim();
        if (phone !== undefined) updates.phone = phone.trim();
        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        res.json({ success: true, message: 'Profile updated.', data: { name: user.name, phone: user.phone } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
