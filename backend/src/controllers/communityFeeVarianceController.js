const CommunityFeeVariance = require('../models/communityFeeVariance');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

// Get all variances for a community
const getByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const variances = await CommunityFeeVariance.getByCommunity(communityId);
    res.status(200).json({
      success: true,
      data: variances
    });
  } catch (error) {
    logger.databaseError('fetch', 'community fee variances by community', error, 'CommunityFeeVarianceController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community fee variances',
      error: error.message
    });
  }
};

// Get variance by ID
const getById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid variance ID is required'
    });
  }

  try {
    const variance = await CommunityFeeVariance.getById(id);
    
    if (!variance) {
      return res.status(404).json({
        success: false,
        message: 'Community fee variance not found'
      });
    }

    res.status(200).json({
      success: true,
      data: variance
    });
  } catch (error) {
    logger.databaseError('fetch', 'community fee variance by ID', error, 'CommunityFeeVarianceController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community fee variance',
      error: error.message
    });
  }
};

// Create variance
const createVariance = async (req, res) => {
  const payload = {};

  // Allowed fields for creation
  const allowedFields = new Set([
    'CommunityID',
    'FeeMasterID',
    'VarianceType',
    'CustomAmount',
    'Notes'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'CustomAmount') {
      const parsed = parseFloat(value);
      payload[key] = isNaN(parsed) ? null : parsed;
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  // Validate required fields
  if (!payload.CommunityID) {
    return res.status(400).json({
      success: false,
      message: 'CommunityID is required'
    });
  }

  if (!payload.FeeMasterID) {
    return res.status(400).json({
      success: false,
      message: 'FeeMasterID is required'
    });
  }

  if (!payload.VarianceType) {
    return res.status(400).json({
      success: false,
      message: 'VarianceType is required'
    });
  }

  try {
    const newVariance = await CommunityFeeVariance.create(payload, req.user?.stakeholderId || null);

    res.status(201).json({
      success: true,
      message: 'Community fee variance created successfully',
      data: newVariance
    });
  } catch (error) {
    logger.databaseError('create', 'community fee variance', error, 'CommunityFeeVarianceController');
    res.status(500).json({
      success: false,
      message: 'Failed to create community fee variance',
      error: error.message
    });
  }
};

// Update variance
const updateVariance = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid variance ID is required'
    });
  }

  const payload = {};

  // Allowed fields for update
  const allowedFields = new Set([
    'VarianceType',
    'CustomAmount',
    'Notes'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'CustomAmount') {
      const parsed = parseFloat(value);
      payload[key] = isNaN(parsed) ? null : parsed;
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  try {
    const updatedVariance = await CommunityFeeVariance.update(id, payload, req.user?.stakeholderId || null);

    if (!updatedVariance) {
      return res.status(404).json({
        success: false,
        message: 'Community fee variance not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Community fee variance updated successfully',
      data: updatedVariance
    });
  } catch (error) {
    logger.databaseError('update', 'community fee variance', error, 'CommunityFeeVarianceController');
    res.status(500).json({
      success: false,
      message: 'Failed to update community fee variance',
      error: error.message
    });
  }
};

// Delete variance (soft delete)
const deleteVariance = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid variance ID is required'
    });
  }

  try {
    await CommunityFeeVariance.delete(id);

    res.status(200).json({
      success: true,
      message: 'Community fee variance deleted successfully'
    });
  } catch (error) {
    logger.databaseError('delete', 'community fee variance', error, 'CommunityFeeVarianceController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete community fee variance',
      error: error.message
    });
  }
};

module.exports = {
  getByCommunity,
  getById,
  createVariance,
  updateVariance,
  deleteVariance
};

