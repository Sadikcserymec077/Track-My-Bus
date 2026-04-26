const express = require('express');
const router = express.Router();
const driver = require('../controllers/driverController');
const { protect, requireRole } = require('../middleware/auth');

const guard = [protect, requireRole('driver', 'admin')];

router.get('/my-bus', ...guard, driver.getMyBus);
router.post('/start-trip', ...guard, driver.startTrip);
router.post('/send-location', ...guard, driver.sendLocation);
router.post('/stop-trip', ...guard, driver.stopTrip);
router.post('/sos', ...guard, driver.sos);
router.post('/board-student', ...guard, driver.boardStudent);
router.get('/trip-history', protect, requireRole('driver'), driver.getTripHistory);

module.exports = router;
