const express = require('express');
const router = express.Router();
const {
    getUserById,
    updateUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../utils/authV2.js');

router.route('/:id')
    .get(protect, authorize('admin'), getUserById)
    .put(protect, authorize('admin'), updateUser);

module.exports = router;
