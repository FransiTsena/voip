const express = require('express');
const router = express.Router();
const { getAgentTodayShifts, updateShiftReason } = require('../controllers/metricsTodayController');

// GET /api/metrics/agent/:agentId/shifts/today?page=1&limit=10
router.get('/agent/:agentId/shifts/today', getAgentTodayShifts);

// PUT /api/shifts/:shiftId/reason
router.put('/shifts/:shiftId/reason', updateShiftReason);

module.exports = router;
