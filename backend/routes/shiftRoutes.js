const express = require('express');
const router = express.Router();
const {
  startShift,
  endShift,
  getAgentShifts,
  updateShiftReason,
} = require('../controllers/shiftController');

router.post('/start', startShift);
router.post('/end', endShift);
router.get('/agent/:agentId', getAgentShifts);

// Add reason update endpoint here
router.put('/:shiftId/reason', updateShiftReason);

module.exports = router;
