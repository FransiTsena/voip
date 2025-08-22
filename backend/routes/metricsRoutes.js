
const express = require('express');
const router = express.Router();

const { getAgentMetrics, getAgentShiftReport } = require('../controllers/metricsController');

router.get('/agent/:agentId', getAgentMetrics);
router.get('/agent/:agentId/shifts', getAgentShiftReport);
// Routes for metrics of users with role 'agent'
router.get('/agent/:agentId', getAgentMetrics);
router.get('/agent/:agentId/shifts', getAgentShiftReport);

module.exports = router;
