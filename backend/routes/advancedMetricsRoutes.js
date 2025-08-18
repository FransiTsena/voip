const express = require('express');
const router = express.Router();
const { getAdvancedMetrics } = require('../controllers/advancedMetricsController');
const { protect, authorize } = require('../utils/authV2.js');

router.get('/', protect, authorize('admin', 'supervisor'), getAdvancedMetrics);

module.exports = router;
