const Community = require('../models/community');
const { logger } = require('../utils/logger');

// Get all communities
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.getAll();
    res.status(200).json({
      success: true,
      message: 'Communities retrieved successfully',
      data: communities,
      count: communities.length
    });
  } catch (error) {
    logger.databaseError('fetch', 'communities', error, 'CommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve communities',
      error: error.message
    });
  }
};

// Get community by ID
const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid community ID is required'
      });
    }

    const community = await Community.getById(parseInt(id));
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Community retrieved successfully',
      data: community
    });
  } catch (error) {
    logger.databaseError('fetch', 'community', error, 'CommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve community',
      error: error.message
    });
  }
};

// Create new community
const createCommunity = async (req, res) => {
  try {
    const communityData = req.body;
    
    // Validate required fields
    if (!communityData.Name) {
      return res.status(400).json({
        success: false,
        message: 'Community name is required'
      });
    }

    if (!communityData.Pcode) {
      return res.status(400).json({
        success: false,
        message: 'Community Pcode is required'
      });
    }

    // Set defaults
    communityData.Status = communityData.Status || 'Active';
    communityData.TimeZone = communityData.TimeZone || 'UTC';
    communityData.DataCompleteness = communityData.DataCompleteness || 0;

    const newCommunity = await Community.create(communityData);
    
    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: newCommunity
    });
    } catch (error) {
    logger.databaseError('create', 'community', error, 'CommunityController');
    
    // Handle duplicate key errors
    if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        message: 'Community with this Pcode already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create community',
      error: error.message
    });
  }
};

// Update community
const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const communityData = req.body;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid community ID is required'
      });
    }

    // Check if community exists
    const existingCommunity = await Community.getById(parseInt(id));
    if (!existingCommunity) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Validate required fields if provided
    if (communityData.Name !== undefined && communityData.Name === '') {
      return res.status(400).json({
        success: false,
        message: 'Community name cannot be empty'
      });
    }

    const updatedCommunity = await Community.update(parseInt(id), communityData);
    
    res.status(200).json({
      success: true,
      message: 'Community updated successfully',
      data: updatedCommunity
    });
  } catch (error) {
    logger.databaseError('update', 'community', error, 'CommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to update community',
      error: error.message
    });
  }
};

// Delete community (soft delete)
const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid community ID is required'
      });
    }

    // Check if community exists
    const existingCommunity = await Community.getById(parseInt(id));
    if (!existingCommunity) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    await Community.delete(parseInt(id));
    
    res.status(200).json({
      success: true,
      message: 'Community deleted successfully'
    });
  } catch (error) {
    logger.databaseError('delete', 'community', error, 'CommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete community',
      error: error.message
    });
  }
};

// Get community with statistics
const getCommunityWithStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid community ID is required'
      });
    }

    const communityStats = await Community.getCommunityWithStats(parseInt(id));
    
    if (!communityStats) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Community statistics retrieved successfully',
      data: communityStats
    });
  } catch (error) {
    logger.databaseError('fetch', 'community with stats', error, 'CommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve community statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityWithStats
};