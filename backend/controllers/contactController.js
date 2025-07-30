const Contact = require('../models/contactModel');

// Create a new contact
exports.createContact = async (req, res) => {
    try {
        const contact = new Contact({ ...req.body, agentId: req.user.id });
        await contact.save();
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all contacts for an agent
exports.getContacts = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const contacts = await Contact.find({ agentId: req.user.id })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await Contact.countDocuments({ agentId: req.user.id });
        res.status(200).json({ contacts, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific contact by ID
exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a contact
exports.updateContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a contact
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
