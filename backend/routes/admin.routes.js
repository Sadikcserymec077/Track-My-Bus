const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

const guard = [protect, requireRole('admin')];

router.get('/dashboard', ...guard, admin.getDashboard);

// Drivers
router.get('/drivers', ...guard, admin.getAllDrivers);
router.post('/drivers', ...guard, admin.createDriver);
router.put('/drivers/:id', ...guard, admin.updateDriver);
router.delete('/drivers/:id', ...guard, admin.deleteDriver);

// Students
router.get('/students', ...guard, admin.getAllStudents);
router.post('/students', ...guard, admin.createStudent);
router.put('/students/:id', ...guard, admin.updateStudent);
router.delete('/students/:id', ...guard, admin.deleteStudent);

// Buses
router.get('/buses', ...guard, admin.getAllBuses);
router.post('/buses', ...guard, admin.createBus);
router.put('/buses/:id', ...guard, admin.updateBus);
router.delete('/buses/:id', ...guard, admin.deleteBus);

// Assign
router.post('/assign-driver', ...guard, admin.assignDriverToBus);
router.post('/assign-student', ...guard, admin.assignStudentToBus);
router.post('/remove-student', ...guard, admin.removeStudentFromBus);

// Live & History
router.get('/live-locations', ...guard, admin.getLiveLocations);
router.get('/trip-history', ...guard, admin.getTripHistory);

// Notifications
router.post('/send-notification', ...guard, admin.sendNotification);

module.exports = router;
