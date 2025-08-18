// TODO: This is a temporary file to work around a file modification issue.
// Once the issue is resolved, this file should be merged with auth.js and this file should be deleted.

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.access_token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user ? req.user.role : 'guest'} is not authorized to access this route`);
    }
    next();
  };
};

module.exports = { protect, authorize };
