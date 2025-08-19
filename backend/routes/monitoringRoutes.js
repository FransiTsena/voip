const express = require('express');
const router = express.Router();
const { initiateMonitoring } = require('../controllers/monitoringController');
const { protect, authorize } = require('../utils/authV2.js');

router.post('/initiate', protect, authorize('admin', 'supervisor'), initiateMonitoring);

module.exports = router;
