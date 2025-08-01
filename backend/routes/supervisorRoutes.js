// =========================
// Suerviros Routes
// =========================
const express = require('express');
const { registerSupervisor, getAllSupervisors, deleteSupervisor, loginSupervisor } = require('../controllers/supervisorController/supervisorController');
const router = express.Router();


// Define agent routes here

router.post('/', registerSupervisor);

// Get all supervisors
router.get('/', getAllSupervisors);

// Delete a supervisor (if needed)
router.delete('/:id', deleteSupervisor); 

// Login supervisor
router.post('/login', loginSupervisor)

// cheak if the supervisor is logged in
router.get('/check-auth', )
module.exports = router;
