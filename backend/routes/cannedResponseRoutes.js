const express = require('express');
const router = express.Router();
const {
  createCannedResponse,
  getCannedResponses,
  getCannedResponseById,
  updateCannedResponse,
  deleteCannedResponse,
} = require('../controllers/cannedResponseController');

router.route('/')
  .post(createCannedResponse)
  .get(getCannedResponses);

router.route('/:id')
  .get(getCannedResponseById)
  .put(updateCannedResponse)
  .delete(deleteCannedResponse);

module.exports = router;
