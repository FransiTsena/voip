// TODO: This is a temporary file to work around a file modification issue.
// Once the issue is resolved, this file should be merged with supervisorRoutes.js and this file should be deleted.

const express = require('express');
const {
    getAllSupervisors,
    getSupervisorById,
    updateSupervisor,
    deleteSupervisor,
} = require('../controllers/supervisorController/supervisorControllerV2.js');
const { protect, authorize } = require('../utils/authV2.js');
const router = express.Router();

router.route('/')
    .get(protect, authorize('admin'), getAllSupervisors);

router.route('/:id')
    .get(protect, authorize('admin'), getSupervisorById)
    .put(protect, authorize('admin'), updateSupervisor)
    .delete(protect, authorize('admin'), deleteSupervisor);

module.exports = router;
