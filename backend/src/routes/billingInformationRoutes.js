const express = require('express');
const router = express.Router();
const billingInformationController = require('../controllers/billingInformationController');
const { authenticateToken } = require('../middleware/auth');

// Get billing information by community ID
router.get('/community/:communityId', authenticateToken, billingInformationController.getByCommunity);

// Get billing information by ID
router.get('/:id', authenticateToken, billingInformationController.getById);

// Create billing information
router.post('/', authenticateToken, billingInformationController.createBillingInformation);

// Update billing information
router.put('/:id', authenticateToken, billingInformationController.updateBillingInformation);

module.exports = router;

