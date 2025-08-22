const CannedResponse = require('../models/cannedResponseModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a new canned response
// @route   POST /api/canned-responses
// @access  Private
const createCannedResponse = asyncHandler(async (req, res) => {
  const { title, body, category, keywords } = req.body;

  const cannedResponse = new CannedResponse({
    title,
    body,
    category,
    keywords,
  });

  const createdCannedResponse = await cannedResponse.save();
  res.status(201).json(createdCannedResponse);
});

// @desc    Get all canned responses
// @route   GET /api/canned-responses
// @access  Private
const getCannedResponses = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { title: { $regex: req.query.keyword, $options: 'i' } },
          { body: { $regex: req.query.keyword, $options: 'i' } },
          { category: { $regex: req.query.keyword, $options: 'i' } },
          { keywords: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const cannedResponses = await CannedResponse.find({ ...keyword });
  res.json(cannedResponses);
});

// @desc    Get a canned response by ID
// @route   GET /api/canned-responses/:id
// @access  Private
const getCannedResponseById = asyncHandler(async (req, res) => {
  const cannedResponse = await CannedResponse.findById(req.params.id);

  if (cannedResponse) {
    res.json(cannedResponse);
  } else {
    res.status(404);
    throw new Error('Canned response not found');
  }
});

// @desc    Update a canned response
// @route   PUT /api/canned-responses/:id
// @access  Private
const updateCannedResponse = asyncHandler(async (req, res) => {
  const { title, body, category, keywords } = req.body;

  const cannedResponse = await CannedResponse.findById(req.params.id);

  if (cannedResponse) {
    cannedResponse.title = title;
    cannedResponse.body = body;
    cannedResponse.category = category;
    cannedResponse.keywords = keywords;

    const updatedCannedResponse = await cannedResponse.save();
    res.json(updatedCannedResponse);
  } else {
    res.status(404);
    throw new Error('Canned response not found');
  }
});

// @desc    Delete a canned response
// @route   DELETE /api/canned-responses/:id
// @access  Private
const deleteCannedResponse = asyncHandler(async (req, res) => {
  const cannedResponse = await CannedResponse.findById(req.params.id);

  if (cannedResponse) {
    await cannedResponse.deleteOne();
    res.json({ message: 'Canned response removed' });
  } else {
    res.status(404);
    throw new Error('Canned response not found');
  }
});

module.exports = {
  createCannedResponse,
  getCannedResponses,
  getCannedResponseById,
  updateCannedResponse,
  deleteCannedResponse,
};
