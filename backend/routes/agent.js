// =========================
// Agent Routes
// =========================
const express = require("express");
const { getAllExtensions, createExtension, getAgentById,  } = require("../controllers/agentControllers/agentController");
const { deleteExtension } = require("../controllers/agentControllers/deleteExtension");
const { getAllAgents } = require("../controllers/agents");
// const agentController = require("../controllers/agents");
const router = express.Router();

// Register a new agent
router.post("/register", createExtension);

// Get all agents (from Asterisk, not DB)
<<<<<<< HEAD
router.get("/", agentController.getAllAgents);
router.get("/:number", agentController.getAgentByNumber);
=======
router.get("/", getAllExtensions);
>>>>>>> 9da554b5846f67087fda3531c230ea96043fbbd0

// // Delete a single agent
router.delete("/:extensionId", deleteExtension  );


// Get Agent By id
router.get("/:id", getAgentById);
// // Update (modify) an agent
// router.put("/:id", agentController.modifyAgent);
router.get('/real-time', getAllAgents);


// // Get agent call statistics
// router.get("/call-stats", agentController.getAllAgentCallStatus);

// //Get Agnets from database
// router.get("/from-database", agentController.getAgentsFromDatabase);

module.exports = router;
