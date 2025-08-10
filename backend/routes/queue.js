const express = require("express");
const queueControllers = require("../controllers/queue");
const queueStatisticsController = require("../controllers/queueStatisticsController");
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

// =========================
// Queue Statistics Routes
// =========================

// Get statistics for all queues
router.get("/statistics/all", queueStatisticsController.getAllQueuesStatistics);

// Get queue comparison statistics
router.get("/statistics/comparison", queueStatisticsController.getQueueComparison);

// Get statistics for a specific queue
router.get("/:queueId/statistics", queueStatisticsController.getQueueStatistics);

// Get hourly trends for a specific queue
router.get("/:queueId/statistics/hourly", queueStatisticsController.getQueueHourlyTrends);

// Manually trigger statistics calculation for a specific queue
router.post("/:queueId/statistics/calculate", queueStatisticsController.triggerStatisticsCalculation);

// Calculate statistics for all queues
router.post("/statistics/calculate-all", queueStatisticsController.calculateAllQueuesStatistics);

// Administrative routes for queue statistics management
router.post("/statistics/backfill", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }
    
    const { backfillQueueStatistics } = require('../utils/queueStatsScheduler');
    const results = await backfillQueueStatistics(startDate, endDate);
    
    res.json({
      success: true,
      message: 'Backfill completed',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Backfill failed',
      error: error.message
    });
  }
});

router.post("/statistics/recalculate-today", async (req, res) => {
  try {
    const { recalculateTodayStats } = require('../utils/queueStatsScheduler');
    const results = await recalculateTodayStats();
    
    res.json({
      success: true,
      message: 'Today\'s statistics recalculated',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Recalculation failed',
      error: error.message
    });
  }
});

module.exports = router;
