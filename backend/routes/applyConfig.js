const express = require('express');
const { applyConfig } = require('../controllers/applyConfig');

const router = express.Router();

// POST /api/apply-config
router.post('/', applyConfig);

module.exports = router;
