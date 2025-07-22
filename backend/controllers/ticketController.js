const Ticket = require('../models/ticketModel');
const Comment = require('../models/commentModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({}).populate('comments');
  res.json(tickets);
});

// @desc    Get a single ticket
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('comments');

  if (ticket) {
    res.json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, priority, agentId, customerId } = req.body;

  const ticket = new Ticket({
    title,
    description,
    priority,
    agentId,
    customerId,
  });

  const createdTicket = await ticket.save();
  res.status(201).json(createdTicket);
});

// @desc    Update a ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = asyncHandler(async (req, res) => {
  const { title, description, status, priority, agentId, customerId } = req.body;

  const ticket = await Ticket.findById(req.params.id);

  if (ticket) {
    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.status = status || ticket.status;
    ticket.priority = priority || ticket.priority;
    ticket.agentId = agentId || ticket.agentId;
    ticket.customerId = customerId || ticket.customerId;

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Add a comment to a ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
const addCommentToTicket = asyncHandler(async (req, res) => {
  const { author, content } = req.body;
  const ticketId = req.params.id;

  const comment = new Comment({
    ticketId,
    author,
    content,
  });

  const createdComment = await comment.save();

  const ticket = await Ticket.findById(ticketId);
  ticket.comments.push(createdComment);
  await ticket.save();

  res.status(201).json(createdComment);
});

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addCommentToTicket,
};
