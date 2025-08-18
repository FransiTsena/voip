const express = require('express');
const router = express.Router();
const {
  searchArticles,
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/kbController');

router.route('/search').get(searchArticles);
router.route('/').post(createArticle);
router.route('/:id').get(getArticleById).put(updateArticle).delete(deleteArticle);

module.exports = router;
