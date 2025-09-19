const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

// All ticket routes require authentication
router.use(authenticateToken);

// Get tickets for logged-in user
router.get('/', ticketController.getTickets);

// Get specific ticket by ID
router.get('/:id', ticketController.getTicketById);

module.exports = router;
