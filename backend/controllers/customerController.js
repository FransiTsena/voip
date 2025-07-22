const Customer = require('../models/customerModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}).populate('ticketHistory');
  res.json(customers);
});

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).populate('ticketHistory');

  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const customer = new Customer({
    name,
    email,
    phone,
  });

  const createdCustomer = await customer.save();
  res.status(201).json(createdCustomer);
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const customer = await Customer.findById(req.params.id);

  if (customer) {
    customer.name = name || customer.name;
    customer.email = email || customer.email;
    customer.phone = phone || customer.phone;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
};
