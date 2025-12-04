const express = require('express');
const router = express.Router();
const feeMasterController = require('../controllers/feeMasterController');
const { authenticateToken } = require('../middleware/auth');

// Get all fees
router.get('/', authenticateToken, feeMasterController.getAll);

// Get fee by ID
router.get('/:id', authenticateToken, feeMasterController.getById);

// Create fee
router.post('/', authenticateToken, feeMasterController.createFee);

// Update fee
router.put('/:id', authenticateToken, feeMasterController.updateFee);

// Delete fee (soft delete)
router.delete('/:id', authenticateToken, feeMasterController.deleteFee);

// Bulk update display order
router.put('/order/bulk', authenticateToken, feeMasterController.bulkUpdateOrder);

module.exports = router;

