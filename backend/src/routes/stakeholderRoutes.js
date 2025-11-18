const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllStakeholders,
  getStakeholderById,
  getStakeholdersByType,
  searchStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
  getStakeholderWithProperties
} = require('../controllers/stakeholderController');

// GET /api/stakeholders - Get all stakeholders
router.get('/', getAllStakeholders);

// GET /api/stakeholders/search?q=john - Search stakeholders
router.get('/search', searchStakeholders);

// GET /api/stakeholders/type/Resident - Get stakeholders by type
router.get('/type/:type', getStakeholdersByType);

// GET /api/stakeholders/5 - Get stakeholder with ID 5
router.get('/:id', getStakeholderById);

// GET /api/stakeholders/5/properties - Get stakeholder with properties
router.get('/:id/properties', getStakeholderWithProperties);

// POST /api/stakeholders - Create new stakeholder (requires auth)
router.post('/', authenticateToken, createStakeholder);

// PUT /api/stakeholders/5 - Update stakeholder with ID 5 (requires auth)
router.put('/:id', authenticateToken, updateStakeholder);

// DELETE /api/stakeholders/5 - Delete stakeholder with ID 5 (requires auth)
router.delete('/:id', authenticateToken, deleteStakeholder);

module.exports = router;