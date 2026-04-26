const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', auth.login);
router.post('/create-user', protect, auth.createUser);
router.post('/change-password', protect, auth.changePassword);
router.patch('/fcm-token', protect, auth.updateFcmToken);
router.patch('/profile', protect, auth.updateProfile);
router.post('/register-parent', auth.registerParent);

module.exports = router;
