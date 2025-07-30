const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

const { validateToken } = require('../utils/auth');
// Create a new contact
router.post('/', validateToken, contactController.createContact);

// Get all contacts
router.get('/', validateToken, contactController.getContacts);

// Get a specific contact by ID
router.get('/:id', validateToken, contactController.getContactById);

// Update a contact
router.put('/:id', validateToken, contactController.updateContact);

// Delete a contact
router.delete('/:id', validateToken, contactController.deleteContact);

module.exports = router;
