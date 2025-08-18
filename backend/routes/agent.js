const express = require('express');
const router = express.Router();
const {
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
} = require('../controllers/agentControllers/agentController');
const { protect, authorize } = require('../utils/authV2.js');

router.route('/')
    .get(protect, authorize('admin', 'supervisor'), getAllAgents);

router.route('/:id')
    .get(protect, authorize('admin', 'supervisor'), getAgentById)
    .put(protect, authorize('admin', 'supervisor'), updateAgent)
    .delete(protect, authorize('admin'), deleteAgent);

module.exports = router;
