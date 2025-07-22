const express = require("express");
const { createQueue, getAllQueues, getQueueById,  deleteQueue } = require("../controllers/queueControllers/queueController");
const { updateQueue } = require("../controllers/queueControllers/updateQueue");
// const queueControllers = require("../controllers/queue");
const router = express.Router();

// =========================
// Queue Management Routes
// =========================

// Create a new queue
router.post("/", createQueue);

// Get all queues
router.get("/", getAllQueues);

// Get a specific queue by id
router.get("/:queueId",getQueueById);

// Update a queue by id (new, processes nested fields like createQueue)
router.put("/:queueId", updateQueue);

// Delete a queue by id
router.delete("/:queueId", deleteQueue);

// Get all members of a queue
// router.get("/:queueId/members", queueControllers);

// Add a member to a queue
// router.post("/:queueId/members", queueControllers.addMemberToQueue);

// Remove a member from a queue
// router.delete("/:queueId/members/:memberId", queueControllers.removeMemberFromQueue);

module.exports = router;
