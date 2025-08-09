const express = require('express');
const router = express.Router();
const {
  holdCall,
  unholdCall,
  muteCall,
  unmuteCall,
  transferCall,
  endCall,
} = require('../controllers/callController');

router.post('/hold', holdCall);
router.post('/unhold', unholdCall);
router.post('/mute', muteCall);
router.post('/unmute', unmuteCall);
router.post('/transfer', transferCall);
router.post('/end', endCall);


module.exports = router;
