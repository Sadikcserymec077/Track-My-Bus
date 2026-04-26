const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Token invalid or user deactivated.' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

// Role-based authorization
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${roles.join(', ')}`
            });
        }
        next();
    };
};
