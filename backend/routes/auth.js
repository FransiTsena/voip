
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
// Only for testing purposes, remove in production
router.post('/register', authController.register);

// Get current agent info (protected)
router.get('/me', authController.verifyToken, authController.me);

module.exports = router;
