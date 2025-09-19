const express = require('express');
const router = express.Router();
const {
  getAllProperties,
  getPropertyById,
  getPropertiesByCommunity,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyWithStakeholders
} = require('../controllers/propertyController');

// GET /api/properties - Get all properties
router.get('/', getAllProperties);

// GET /api/properties/5 - Get property with ID 5
router.get('/:id', getPropertyById);

// GET /api/properties/5/stakeholders - Get property with all stakeholders
router.get('/:id/stakeholders', getPropertyWithStakeholders);

// GET /api/properties/community/3 - Get all properties in community 3
router.get('/community/:communityId', getPropertiesByCommunity);

// POST /api/properties - Create new property
router.post('/', createProperty);

// PUT /api/properties/5 - Update property with ID 5
router.put('/:id', updateProperty);

// DELETE /api/properties/5 - Delete property with ID 5
router.delete('/:id', deleteProperty);

module.exports = router;