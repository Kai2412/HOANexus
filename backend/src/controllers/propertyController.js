const Property = require('../models/property');
const { logger } = require('../utils/logger');
const Community = require('../models/community');

// Get all properties
const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.getAll();
    res.status(200).json({
      success: true,
      message: 'Properties retrieved successfully',
      data: properties,
      count: properties.length
    });
  } catch (error) {
    logger.databaseError('fetch', 'properties', error, 'PropertyController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve properties',
      error: error.message
    });
  }
};

// Get property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid property ID is required'
      });
    }

    const property = await Property.getById(parseInt(id));
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property retrieved successfully',
      data: property
    });
  } catch (error) {
    logger.databaseError('fetch', 'property', error, 'PropertyController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve property',
      error: error.message
    });
  }
};

// Get properties by community ID
const getPropertiesByCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    
    // Validate community ID
    if (!communityId || isNaN(communityId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid community ID is required'
      });
    }

    // Check if community exists
    const community = await Community.getById(parseInt(communityId));
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const properties = await Property.getByCommunity(parseInt(communityId));
    
    res.status(200).json({
      success: true,
      message: `Properties for community "${community.Name}" retrieved successfully`,
      data: properties,
      count: properties.length,
      community: {
        id: community.ID,
        name: community.Name,
        displayName: community.DisplayName
      }
    });
  } catch (error) {
    logger.databaseError('fetch', 'properties by community', error, 'PropertyController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve properties by community',
      error: error.message
    });
  }
};

// Create new property
const createProperty = async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Validate required fields
    if (!propertyData.CommunityID) {
      return res.status(400).json({
        success: false,
        message: 'Community ID is required'
      });
    }

    if (!propertyData.Address) {
      return res.status(400).json({
        success: false,
        message: 'Property address is required'
      });
    }

    // Check if community exists
    const community = await Community.getById(propertyData.CommunityID);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Set defaults
    propertyData.Status = propertyData.Status || 'Active';
    propertyData.OccupancyType = propertyData.OccupancyType || 'Owner-Occupied';

    // Validate numeric fields
    if (propertyData.BedCount && propertyData.BedCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bed count cannot be negative'
      });
    }

    if (propertyData.BathCount && propertyData.BathCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bath count cannot be negative'
      });
    }

    if (propertyData.SquareFootage && propertyData.SquareFootage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Square footage cannot be negative'
      });
    }

    const newProperty = await Property.create(propertyData);
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: newProperty
    });
  } catch (error) {
    logger.databaseError('create', 'property', error, 'PropertyController');
    
    // Handle duplicate key errors
    if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
      return res.status(500).json({
        success: false,
        message: 'Property with this address already exists in the community'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
};

// Update property
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid property ID is required'
      });
    }

    // Check if property exists
    const existingProperty = await Property.getById(parseInt(id));
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // If CommunityID is being changed, verify new community exists
    if (propertyData.CommunityID && propertyData.CommunityID !== existingProperty.CommunityID) {
      const community = await Community.getById(propertyData.CommunityID);
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'New community not found'
        });
      }
    }

    // Validate required fields if provided
    if (propertyData.Address === '') {
      return res.status(400).json({
        success: false,
        message: 'Property address cannot be empty'
      });
    }

    // Validate numeric fields
    if (propertyData.BedCount && propertyData.BedCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bed count cannot be negative'
      });
    }

    if (propertyData.BathCount && propertyData.BathCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bath count cannot be negative'
      });
    }

    if (propertyData.SquareFootage && propertyData.SquareFootage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Square footage cannot be negative'
      });
    }

    const updatedProperty = await Property.update(parseInt(id), propertyData);
    
    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    logger.databaseError('update', 'property', error, 'PropertyController');
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message
    });
  }
};

// Delete property (soft delete)
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid property ID is required'
      });
    }

    // Check if property exists
    const existingProperty = await Property.getById(parseInt(id));
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await Property.delete(parseInt(id));
    
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    logger.databaseError('delete', 'property', error, 'PropertyController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message
    });
  }
};

// Get property with stakeholders
const getPropertyWithStakeholders = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid property ID is required'
      });
    }

    const propertyWithStakeholders = await Property.getPropertyWithStakeholders(parseInt(id));
    
    if (!propertyWithStakeholders || propertyWithStakeholders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property with stakeholders retrieved successfully',
      data: propertyWithStakeholders
    });
  } catch (error) {
    logger.databaseError('fetch', 'property with stakeholders', error, 'PropertyController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve property with stakeholders',
      error: error.message
    });
  }
};

module.exports = {
  getAllProperties,
  getPropertyById,
  getPropertiesByCommunity,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyWithStakeholders
};