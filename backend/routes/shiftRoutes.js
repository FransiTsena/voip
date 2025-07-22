const express = require('express');
const router = express.Router();
const {
  startShift,
  endShift,
  getAgentShifts,
} = require('../controllers/shiftController');

router.post('/start', startShift);
router.post('/end', endShift);
router.get('/agent/:agentId', getAgentShifts);

module.exports = router;
