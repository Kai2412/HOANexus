const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getDynamicDropChoices,
  createDynamicDropChoice,
  updateDynamicDropChoice,
  toggleActiveStatus,
  bulkUpdateOrder
} = require('../controllers/dynamicDropChoicesController');

// All routes require authentication
router.get('/', authenticateToken, getDynamicDropChoices);
router.post('/', authenticateToken, createDynamicDropChoice);
router.put('/:choiceId', authenticateToken, updateDynamicDropChoice);
router.put('/:choiceId/toggle-active', authenticateToken, toggleActiveStatus);
router.post('/bulk-update-order', authenticateToken, bulkUpdateOrder);

module.exports = router;

