const express = require('express');
const router = express.Router();
const {
  searchArticles,
  createArticle,
} = require('../controllers/kbController');

router.route('/search').get(searchArticles);
router.route('/').post(createArticle);

module.exports = router;
