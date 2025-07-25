
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateToken } = require('../utils/auth'); // Import the token validation middleware

router.post('/login', authController.login);
// Only for testing purposes, remove in production
router.post('/register', authController.register);

// Get current agent info (protected)
router.get('/me', validateToken, authController.me);

// Logout route to clear token
router.post('/logout', validateToken, authController.logout);
module.exports = router;
