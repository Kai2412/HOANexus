const express = require('express');
const router = express.Router();
const communityFeeVarianceController = require('../controllers/communityFeeVarianceController');
const { authenticateToken } = require('../middleware/auth');

// Get all variances for a community
router.get('/community/:communityId', authenticateToken, communityFeeVarianceController.getByCommunity);

// Get variance by ID
router.get('/:id', authenticateToken, communityFeeVarianceController.getById);

// Create variance
router.post('/', authenticateToken, communityFeeVarianceController.createVariance);

// Update variance
router.put('/:id', authenticateToken, communityFeeVarianceController.updateVariance);

// Delete variance (soft delete)
router.delete('/:id', authenticateToken, communityFeeVarianceController.deleteVariance);

module.exports = router;

