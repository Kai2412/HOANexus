const BoardInformation = require('../models/boardInformation');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

// Get board information by community ID
const getByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const boardInformation = await BoardInformation.getByCommunity(communityId);
    
    if (!boardInformation) {
      return res.status(404).json({
        success: false,
        message: 'Board information not found for this community'
      });
    }

    res.status(200).json({
      success: true,
      data: boardInformation
    });
  } catch (error) {
    logger.databaseError('fetch', 'board information by community', error, 'BoardInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board information',
      error: error.message
    });
  }
};

// Get board information by ID
const getById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid board information ID is required'
    });
  }

  try {
    const boardInformation = await BoardInformation.getById(id);
    
    if (!boardInformation) {
      return res.status(404).json({
        success: false,
        message: 'Board information not found'
      });
    }

    res.status(200).json({
      success: true,
      data: boardInformation
    });
  } catch (error) {
    logger.databaseError('fetch', 'board information by ID', error, 'BoardInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch board information',
      error: error.message
    });
  }
};

// Create board information
const createBoardInformation = async (req, res) => {
  try {
    const createdBy = req.user?.userId || null;

    // Validate required fields
    if (!req.body.CommunityID) {
      return res.status(400).json({
        success: false,
        message: 'CommunityID is required'
      });
    }

    if (!isGuid(req.body.CommunityID)) {
      return res.status(400).json({
        success: false,
        message: 'Valid CommunityID is required'
      });
    }

    const boardInformation = await BoardInformation.create(req.body, createdBy);

    res.status(201).json({
      success: true,
      message: 'Board information created successfully',
      data: boardInformation
    });
  } catch (error) {
    logger.databaseError('create', 'board information', error, 'BoardInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to create board information',
      error: error.message
    });
  }
};

// Update board information
const updateBoardInformation = async (req, res) => {
  try {
    const { id } = req.params;
    const modifiedBy = req.user?.userId || null;

    if (!isGuid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid board information ID is required'
      });
    }

    const boardInformation = await BoardInformation.update(id, req.body, modifiedBy);

    if (!boardInformation) {
      return res.status(404).json({
        success: false,
        message: 'Board information not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Board information updated successfully',
      data: boardInformation
    });
  } catch (error) {
    logger.databaseError('update', 'board information', error, 'BoardInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to update board information',
      error: error.message
    });
  }
};

module.exports = {
  getByCommunity,
  getById,
  createBoardInformation,
  updateBoardInformation
};

