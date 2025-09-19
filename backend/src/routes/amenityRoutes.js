const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');

// Get all amenities for a community
router.get('/:communityId/amenities', amenityController.getAmenities);

// Get single amenity by ID
router.get('/amenity/:amenityId', amenityController.getAmenityById);

// Get amenity types configuration
router.get('/config/types', amenityController.getAmenityTypes);

// Get status types configuration
router.get('/config/statuses', amenityController.getStatusTypes);

module.exports = router;
