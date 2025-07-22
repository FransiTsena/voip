const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addCommentToTicket,
} = require('../controllers/ticketController');
const { verifyToken } = require('../controllers/authController');

// Protect all ticket routes
router.use(verifyToken);

router.route('/').get(getTickets).post(createTicket);
router.route('/:id').get(getTicketById).put(updateTicket);
router.route('/:id/comments').post(addCommentToTicket);

module.exports = router;
