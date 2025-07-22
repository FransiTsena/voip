const Article = require('../models/articleModel');
const asyncHandler = require('express-async-handler');

// @desc    Search for articles
// @route   GET /api/kb/search
// @access  Private
const searchArticles = asyncHandler(async (req, res) => {
  const keyword = req.query.q
    ? {
        $or: [
          { title: { $regex: req.query.q, $options: 'i' } },
          { content: { $regex: req.query.q, $options: 'i' } },
          { keywords: { $regex: req.query.q, $options: 'i' } },
        ],
      }
    : {};

  const articles = await Article.find({ ...keyword });
  res.json(articles);
});

// @desc    Create a new article
// @route   POST /api/kb
// @access  Private
const createArticle = asyncHandler(async (req, res) => {
  const { title, content, keywords } = req.body;

  const article = new Article({
    title,
    content,
    keywords,
  });

  const createdArticle = await article.save();
  res.status(201).json(createdArticle);
});

module.exports = {
  searchArticles,
  createArticle,
};
