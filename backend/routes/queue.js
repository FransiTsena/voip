const express = require("express");
const queueControllers = require("../controllers/queue");
const router = express.Router();

// =========================
// Queue Management Routes
// =========================

// Create a new queue
router.post("/", queueControllers.createQueue);

// Get all queues
router.get("/", queueControllers.getAllQueues);

// Get a specific queue by id
router.get("/:queueId", queueControllers.getQueue);

// Update a queue by id
router.put("/:queueId", queueControllers.updateQueue);

// Delete a queue by id
router.delete("/:queueId", queueControllers.deleteQueue);

// Get all members of a queue
router.get("/:queueId/members", queueControllers.getQueueMember);

// Add a member to a queue
router.post("/:queueId/members", queueControllers.addMemberToQueue);

// Remove a member from a queue
router.delete("/:queueId/members/:memberId", queueControllers.removeMemberFromQueue);

module.exports = router;
