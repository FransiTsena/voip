// =========================
// Agent Routes
// =========================
const express = require("express");
const agentController = require("../controllers/agents");
const router = express.Router();

// Register a new agent
router.post("/register", agentController.registerAgent);

// Get all agents (from Asterisk, not DB)
router.get("/", agentController.getAllAgents);
router.get("/:number", agentController.getAgentByNumber);

// Delete a single agent
router.delete("/:id", agentController.deleteSingleAgents);

// Update (modify) an agent
router.put("/:id", agentController.modifyAgent);

// Get agent call statistics
router.get("/call-stats", agentController.getAllAgentCallStatus);

//Get Agnets from database
router.get("/from-database", agentController.getAgentsFromDatabase);

module.exports = router;
