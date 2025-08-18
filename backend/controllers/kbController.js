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

// @desc    Get article by ID
// @route   GET /api/kb/:id
// @access  Private
const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (article) {
    res.json(article);
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

// @desc    Update an article
// @route   PUT /api/kb/:id
// @access  Private
const updateArticle = asyncHandler(async (req, res) => {
  const { title, content, keywords } = req.body;

  const article = await Article.findById(req.params.id);

  if (article) {
    article.title = title;
    article.content = content;
    article.keywords = keywords;

    const updatedArticle = await article.save();
    res.json(updatedArticle);
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

// @desc    Delete an article
// @route   DELETE /api/kb/:id
// @access  Private
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (article) {
    await article.deleteOne();
    res.json({ message: 'Article removed' });
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

module.exports = {
  searchArticles,
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle,
};
