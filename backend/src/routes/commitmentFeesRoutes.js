const express = require('express');
const router = express.Router();
const commitmentFeesController = require('../controllers/commitmentFeesController');
const { authenticateToken } = require('../middleware/auth');

// Get all commitment fees for a community
router.get('/community/:communityId', authenticateToken, commitmentFeesController.getByCommunity);

// Get commitment fee by ID
router.get('/:id', authenticateToken, commitmentFeesController.getById);

// Create commitment fee
router.post('/', authenticateToken, commitmentFeesController.createCommitmentFee);

// Update commitment fee
router.put('/:id', authenticateToken, commitmentFeesController.updateCommitmentFee);

// Delete commitment fee (soft delete)
router.delete('/:id', authenticateToken, commitmentFeesController.deleteCommitmentFee);

module.exports = router;

