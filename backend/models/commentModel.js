const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
