const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
} = require('../controllers/customerController');

router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomerById).put(updateCustomer);

module.exports = router;
