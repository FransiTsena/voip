const express = require('express');
const router = express.Router();
const { getAgentMetrics } = require('../controllers/metricsController');

router.get('/agent/:agentId', getAgentMetrics);

module.exports = router;
