const express = require('express');
const router = express.Router();
const managementFeeController = require('../controllers/managementFeeController');
const { authenticateToken } = require('../middleware/auth');

// Get management fee by community ID
router.get('/community/:communityId', authenticateToken, managementFeeController.getByCommunity);

// Get management fee by ID
router.get('/:id', authenticateToken, managementFeeController.getById);

// Create management fee
router.post('/', authenticateToken, managementFeeController.createManagementFee);

// Update management fee
router.put('/:id', authenticateToken, managementFeeController.updateManagementFee);

module.exports = router;

