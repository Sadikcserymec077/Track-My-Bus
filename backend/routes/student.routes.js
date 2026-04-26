const express = require('express');
const router = express.Router();
const student = require('../controllers/studentController');
const { protect, requireRole } = require('../middleware/auth');

const guard = [protect, requireRole('student', 'admin', 'parent')];

router.get('/my-bus', ...guard, student.getMyBus);
router.get('/track-bus/:busId', protect, student.trackBus);
router.get('/all-bus-locations', protect, student.getAllBusLocations);
router.get('/notifications', protect, student.getNotifications);
router.patch('/notifications/:id/read', protect, student.markRead);
router.post('/sos', protect, student.sos);

module.exports = router;
