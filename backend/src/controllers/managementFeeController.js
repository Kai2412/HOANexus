const ManagementFee = require('../models/managementFee');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

// Get management fee by community ID
const getByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const managementFee = await ManagementFee.getByCommunity(communityId);
    
    if (!managementFee) {
      return res.status(404).json({
        success: false,
        message: 'Management fee not found for this community'
      });
    }

    res.status(200).json({
      success: true,
      data: managementFee
    });
  } catch (error) {
    logger.databaseError('fetch', 'management fee by community', error, 'ManagementFeeController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch management fee',
      error: error.message
    });
  }
};

// Get management fee by ID
const getById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid management fee ID is required'
    });
  }

  try {
    const managementFee = await ManagementFee.getById(id);
    
    if (!managementFee) {
      return res.status(404).json({
        success: false,
        message: 'Management fee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: managementFee
    });
  } catch (error) {
    logger.databaseError('fetch', 'management fee by ID', error, 'ManagementFeeController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch management fee',
      error: error.message
    });
  }
};

// Create management fee
const createManagementFee = async (req, res) => {
  const payload = {};

  // Allowed fields for creation
  const allowedFields = new Set([
    'CommunityID',
    'ManagementFee',
    'PerUnitFee',
    'FeeType',
    'IncreaseType',
    'IncreaseEffective',
    'BoardApprovalRequired',
    'AutoIncrease',
    'FixedCost'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'ManagementFee' || key === 'PerUnitFee' || key === 'FixedCost') {
      if (value === '' || value === null || value === undefined) {
        payload[key] = null;
      } else {
        const parsed = Number(value);
        payload[key] = Number.isNaN(parsed) ? null : parsed;
      }
    } else if (key === 'BoardApprovalRequired') {
      payload[key] = value === true || value === 'true' || value === 1 || value === '1';
    } else if (key === 'IncreaseEffective') {
      payload[key] = value === '' || value === null || value === undefined ? null : value;
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  // Validate required field
  if (!payload.CommunityID) {
    return res.status(400).json({
      success: false,
      message: 'CommunityID is required'
    });
  }

  try {
    const newManagementFee = await ManagementFee.create(payload, req.user?.stakeholderId || null);

    res.status(201).json({
      success: true,
      message: 'Management fee created successfully',
      data: newManagementFee
    });
  } catch (error) {
    logger.databaseError('create', 'management fee', error, 'ManagementFeeController');
    res.status(500).json({
      success: false,
      message: 'Failed to create management fee',
      error: error.message
    });
  }
};

// Update management fee
const updateManagementFee = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid management fee ID is required'
    });
  }

  const payload = {};

  // Allowed fields for update
  const allowedFields = new Set([
    'ManagementFee',
    'PerUnitFee',
    'FeeType',
    'IncreaseType',
    'IncreaseEffective',
    'BoardApprovalRequired',
    'AutoIncrease',
    'FixedCost'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'ManagementFee' || key === 'PerUnitFee' || key === 'FixedCost') {
      if (value === '' || value === null || value === undefined) {
        payload[key] = null;
      } else {
        const parsed = Number(value);
        payload[key] = Number.isNaN(parsed) ? null : parsed;
      }
    } else if (key === 'BoardApprovalRequired') {
      payload[key] = value === true || value === 'true' || value === 1 || value === '1';
    } else if (key === 'IncreaseEffective') {
      payload[key] = value === '' || value === null || value === undefined ? null : value;
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  try {
    const updatedManagementFee = await ManagementFee.update(id, payload, req.user?.stakeholderId || null);

    if (!updatedManagementFee) {
      return res.status(404).json({
        success: false,
        message: 'Management fee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Management fee updated successfully',
      data: updatedManagementFee
    });
  } catch (error) {
    logger.databaseError('update', 'management fee', error, 'ManagementFeeController');
    res.status(500).json({
      success: false,
      message: 'Failed to update management fee',
      error: error.message
    });
  }
};

module.exports = {
  getByCommunity,
  getById,
  createManagementFee,
  updateManagementFee
};

