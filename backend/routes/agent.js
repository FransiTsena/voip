// =========================
// Agent Routes
// =========================
const express = require("express");
const { getAllExtensions, createExtension, getAgentById, } = require("../controllers/agentControllers/agentController");
const { deleteExtension } = require("../controllers/agentControllers/deleteExtension");
const { getAllAgents, getAgentByNumber } = require("../controllers/agents");
// const agentController = require("../controllers/agents");
const router = express.Router();

// Register a new agent
router.post("/register", createExtension);

// Get all agents (from Asterisk, not DB)
router.get("/", getAllAgents);
router.get("/:number", getAgentByNumber);

// // Delete a single agent
router.delete("/:extensionId", deleteExtension);


// Get Agent By id
router.get("/:id", getAgentById);
// // Update (modify) an agent
// router.put("/:id", modifyAgent);
router.get('/real-time', getAllAgents);


// // Get agent call statistics
// router.get("/call-stats", getAllAgentCallStatus);

// //Get Agnets from database
// router.get("/from-database", getAgentsFromDatabase);

module.exports = router;
