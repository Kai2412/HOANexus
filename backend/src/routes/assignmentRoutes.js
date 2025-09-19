const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// Create new assignment request
router.post('/requests', assignmentController.createAssignmentRequest);

// Get assignment requests (with optional filters)
router.get('/requests', assignmentController.getAssignmentRequests);

// Get specific assignment request by ID
router.get('/requests/:id', assignmentController.getAssignmentRequestById);

module.exports = router;
