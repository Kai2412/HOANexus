const express = require('express');
const router = express.Router();
const managementTeamController = require('../controllers/managementTeamController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get management team for a community
router.get('/community/:communityId', managementTeamController.getManagementTeam);

module.exports = router;
