const CommitmentFees = require('../models/commitmentFees');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

// Get all commitment fees for a community
const getByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const commitmentFees = await CommitmentFees.getByCommunity(communityId);
    res.status(200).json({
      success: true,
      data: commitmentFees
    });
  } catch (error) {
    logger.databaseError('fetch', 'commitment fees by community', error, 'CommitmentFeesController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commitment fees',
      error: error.message
    });
  }
};

// Get commitment fee by ID
const getById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid commitment fee ID is required'
    });
  }

  try {
    const commitmentFee = await CommitmentFees.getById(id);
    
    if (!commitmentFee) {
      return res.status(404).json({
        success: false,
        message: 'Commitment fee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: commitmentFee
    });
  } catch (error) {
    logger.databaseError('fetch', 'commitment fee by ID', error, 'CommitmentFeesController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commitment fee',
      error: error.message
    });
  }
};

// Create commitment fee
const createCommitmentFee = async (req, res) => {
  const payload = {};

  // Allowed fields for creation
  const allowedFields = new Set([
    'CommunityID',
    'CommitmentTypeID',
    'EntryType',
    'FeeName',
    'Value',
    'Notes'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'Value') {
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

  if (!payload.CommitmentTypeID) {
    return res.status(400).json({
      success: false,
      message: 'CommitmentTypeID is required'
    });
  }

  if (!payload.FeeName || payload.FeeName.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'FeeName is required'
    });
  }

  // Value is only required for Compensation entries
  if (payload.EntryType === 'Compensation') {
    if (payload.Value === null || payload.Value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Value is required for Compensation entries'
      });
    }
    const numValue = parseFloat(payload.Value);
    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Value must be a valid number greater than or equal to 0'
      });
    }
  }
  // For Commitment entries, Value should be null (not used)

  try {
    const newCommitmentFee = await CommitmentFees.create(payload, req.user?.stakeholderId || null);

    res.status(201).json({
      success: true,
      message: 'Commitment fee created successfully',
      data: newCommitmentFee
    });
  } catch (error) {
    logger.databaseError('create', 'commitment fee', error, 'CommitmentFeesController');
    res.status(500).json({
      success: false,
      message: 'Failed to create commitment fee',
      error: error.message
    });
  }
};

// Update commitment fee
const updateCommitmentFee = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid commitment fee ID is required'
    });
  }

  const payload = {};

  // Allowed fields for update
  const allowedFields = new Set([
    'CommitmentTypeID',
    'EntryType',
    'FeeName',
    'Value',
    'Notes'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'Value') {
      const parsed = parseFloat(value);
      payload[key] = isNaN(parsed) ? null : parsed;
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  // Validate Value based on EntryType (if EntryType is being updated)
  if (payload.EntryType !== undefined) {
    if (payload.EntryType === 'Compensation') {
      // If switching to Compensation, Value must be provided
      if (payload.Value === null || payload.Value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Value is required when EntryType is Compensation'
        });
      }
      const numValue = parseFloat(payload.Value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'Value must be a valid number greater than or equal to 0'
        });
      }
    }
    // If switching to Commitment, Value should be set to null
    if (payload.EntryType === 'Commitment' && payload.Value !== undefined) {
      payload.Value = null;
    }
  } else if (payload.Value !== undefined) {
    // If EntryType is not being updated, check the current EntryType
    // We'll need to fetch the current record to validate
    // For now, just validate the Value format if provided
    if (payload.Value !== null) {
      const numValue = parseFloat(payload.Value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'Value must be a valid number greater than or equal to 0'
        });
      }
    }
  }

  try {
    const updatedCommitmentFee = await CommitmentFees.update(id, payload, req.user?.stakeholderId || null);

    if (!updatedCommitmentFee) {
      return res.status(404).json({
        success: false,
        message: 'Commitment fee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Commitment fee updated successfully',
      data: updatedCommitmentFee
    });
  } catch (error) {
    logger.databaseError('update', 'commitment fee', error, 'CommitmentFeesController');
    res.status(500).json({
      success: false,
      message: 'Failed to update commitment fee',
      error: error.message
    });
  }
};

// Delete commitment fee (soft delete)
const deleteCommitmentFee = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid commitment fee ID is required'
    });
  }

  try {
    await CommitmentFees.delete(id);

    res.status(200).json({
      success: true,
      message: 'Commitment fee deleted successfully'
    });
  } catch (error) {
    logger.databaseError('delete', 'commitment fee', error, 'CommitmentFeesController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete commitment fee',
      error: error.message
    });
  }
};

module.exports = {
  getByCommunity,
  getById,
  createCommitmentFee,
  updateCommitmentFee,
  deleteCommitmentFee
};

