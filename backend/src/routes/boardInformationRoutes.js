const express = require('express');
const router = express.Router();
const boardInformationController = require('../controllers/boardInformationController');
const { authenticateToken } = require('../middleware/auth');

// Get board information by community ID
router.get('/community/:communityId', authenticateToken, boardInformationController.getByCommunity);

// Get board information by ID
router.get('/:id', authenticateToken, boardInformationController.getById);

// Create board information
router.post('/', authenticateToken, boardInformationController.createBoardInformation);

// Update board information
router.put('/:id', authenticateToken, boardInformationController.updateBoardInformation);

module.exports = router;

