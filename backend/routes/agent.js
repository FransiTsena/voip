// =========================
// Agent Routes
// =========================
const express = require('express');
const router = express.Router();
const {
    createExtension,
    getAllExtensions,
    getExtensionByUserExtension,
    updateExtension,
    getAgentById,

} = require('../controllers/agentControllers/agentController');
const { deleteExtension } = require('../controllers/agentControllers/deleteExtension'); // Import the delete function
const { getAllAgents } = require('../controllers/agents');
// const { verifyToken } = require('../controllers/authController');

// Protect all agent routes
// router.use(verifyToken);

// Define agent routes here

module.exports = router;
// Register a new agent
router.post("/register", createExtension);

// Get all agents (from Asterisk, not DB)
router.get("/", getAllExtensions);

// Get a single agent by user extension
router.get("/:number", getExtensionByUserExtension);

// // Delete a single agent
router.delete("/:extensionId", deleteExtension);

// Update an agent's details
router.put("/:extensionId", updateExtension);

// Get Agent By id
router.get("/ex/:id", getAgentById);

// // Update (modify) an agent
// router.put("/:id", modifyAgent);
router.get('/extension/real-time', getAllAgents);


// // Get agent call statistics
// router.get("/call-stats", getAllAgentCallStatus);

// //Get Agnets from database
// router.get("/from-database", getAgentsFromDatabase);

module.exports = router;
