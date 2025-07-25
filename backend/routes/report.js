
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report_controller');
const agentsController = require('../controllers/agents');
const {
    createExtension,
    getAllExtensions,
    getExtensionByUserExtension,
    updateExtension,
    getAgentById,
} = require('../controllers/agentControllers/agentController');
const queueController = require('../controllers/queue');



// AGENTS REPORT ROUTES
// GET /report/agents/all
router.get('/agents/all', agentsController.getAllAgents);
// GET /report/agents/call-status
router.get('/agents/call-status', agentsController.getAllAgentCallStatus);
// GET /report/agents/count
router.get('/agents/count', agentsController.getAgentCount);
// GET /report/agents/:id
router.get('/agents/:id', agentsController.checkExtensionExists);

// QUEUE REPORT ROUTES
// GET /report/queues/all
router.get('/queues/all', queueController.getAllQueues);
// GET /report/queues/:id/members
router.get('/queues/:id/members', queueController.getQueueMember);
// GET /report/queues/count
router.get('/queues/count', queueController.getQueueCount);
// GET /report/queues/:id
router.get('/queues/:id', queueController.getQueue);

// CALL REPORT ROUTES
// GET /report/calls
router.get('/calls', reportController.getCallReport);
// GET /report/calls/all
router.get('/calls/all', reportController.getAllCalls);
// GET /report/calls/count
router.get('/calls/count', reportController.getCallCounts);
// GET /report/calls/by-caller?callerId=12345&callerName=John
router.get('/calls/by-caller', reportController.getCallsByCaller);
// GET /report/calls/:id
router.get('/calls/:id', reportController.getCallById);
// GET /report/calls/summary
module.exports = router;
