const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addCommentToTicket,
} = require('../controllers/ticketController');
const { validateToken } = require('../utils/auth'); // Import the token validation middleware

// Protect all ticket routes
router.use(validateToken);

router.route('/').get(getTickets).post(createTicket);
router.route('/:id').get(getTicketById).put(updateTicket);
router.route('/:id/comments').post(addCommentToTicket);

module.exports = router;
