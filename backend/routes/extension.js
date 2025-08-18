const express = require('express');
const router = express.Router();
const {
    createExtension,
    getAllExtensions,
    getExtensionByUserExtension,
    updateExtension,
} = require('../controllers/extensionController');
const { deleteExtension } = require('../controllers/agentControllers/deleteExtension');
const { protect, authorize } = require('../utils/authV2.js');

router.post('/', protect, authorize('admin', 'supervisor'), createExtension);
router.get('/', protect, authorize('admin', 'supervisor'), getAllExtensions);
router.get('/:userExtension', protect, authorize('admin', 'supervisor'), getExtensionByUserExtension);
router.put('/:userExtension', protect, authorize('admin', 'supervisor'), updateExtension);
router.delete('/:extensionId', protect, authorize('admin'), deleteExtension);

module.exports = router;
