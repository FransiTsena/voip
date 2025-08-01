const express = require('express');
const { registerSupervisor, getAllSupervisors, deleteSupervisor, loginSupervisor, protect, checkAuth, logoutSupervisor } = require('../controllers/supervisorController/supervisorController');
const router = express.Router();

// Define agent routes here

router.post('/', registerSupervisor);

// Login supervisor
router.post('/login', loginSupervisor);

// Protected routes
router.use(protect);

// Check if the supervisor is logged in
router.get('/check-auth', checkAuth);

// Get all supervisors
router.get('/', getAllSupervisors);

// Delete a supervisor (if needed)
router.delete('/:id', deleteSupervisor);

// Logout route (if needed)
router.post('/logout', logoutSupervisor);
module.exports = router;