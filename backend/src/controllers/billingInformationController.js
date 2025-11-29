const BillingInformation = require('../models/billingInformation');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

// Get billing information by community ID
const getByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const billingInformation = await BillingInformation.getByCommunity(communityId);
    
    if (!billingInformation) {
      return res.status(404).json({
        success: false,
        message: 'Billing information not found for this community'
      });
    }

    res.status(200).json({
      success: true,
      data: billingInformation
    });
  } catch (error) {
    logger.databaseError('fetch', 'billing information by community', error, 'BillingInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing information',
      error: error.message
    });
  }
};

// Get billing information by ID
const getById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid billing information ID is required'
    });
  }

  try {
    const billingInformation = await BillingInformation.getById(id);
    
    if (!billingInformation) {
      return res.status(404).json({
        success: false,
        message: 'Billing information not found'
      });
    }

    res.status(200).json({
      success: true,
      data: billingInformation
    });
  } catch (error) {
    logger.databaseError('fetch', 'billing information by ID', error, 'BillingInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing information',
      error: error.message
    });
  }
};

// Create billing information
const createBillingInformation = async (req, res) => {
  const payload = {};

  // Allowed fields for creation
  const allowedFields = new Set([
    'CommunityID',
    'BillingFrequency',
    'BillingMonth',
    'BillingDay',
    'NoticeRequirement',
    'Coupon'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'BillingMonth' || key === 'BillingDay') {
      if (value === '' || value === null || value === undefined) {
        payload[key] = null;
      } else {
        const parsed = Number(value);
        payload[key] = Number.isNaN(parsed) ? null : parsed;
      }
    } else if (key === 'Coupon') {
      payload[key] = value === true || value === 'true' || value === 1 || value === '1';
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
    const newBillingInformation = await BillingInformation.create(payload, req.user?.stakeholderId || null);

    res.status(201).json({
      success: true,
      message: 'Billing information created successfully',
      data: newBillingInformation
    });
  } catch (error) {
    logger.databaseError('create', 'billing information', error, 'BillingInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to create billing information',
      error: error.message
    });
  }
};

// Update billing information
const updateBillingInformation = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid billing information ID is required'
    });
  }

  const payload = {};

  // Allowed fields for update
  const allowedFields = new Set([
    'BillingFrequency',
    'BillingMonth',
    'BillingDay',
    'NoticeRequirement',
    'Coupon'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'BillingMonth' || key === 'BillingDay') {
      if (value === '' || value === null || value === undefined) {
        payload[key] = null;
      } else {
        const parsed = Number(value);
        payload[key] = Number.isNaN(parsed) ? null : parsed;
      }
    } else if (key === 'Coupon') {
      payload[key] = value === true || value === 'true' || value === 1 || value === '1';
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  try {
    const updatedBillingInformation = await BillingInformation.update(id, payload, req.user?.stakeholderId || null);

    if (!updatedBillingInformation) {
      return res.status(404).json({
        success: false,
        message: 'Billing information not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Billing information updated successfully',
      data: updatedBillingInformation
    });
  } catch (error) {
    logger.databaseError('update', 'billing information', error, 'BillingInformationController');
    res.status(500).json({
      success: false,
      message: 'Failed to update billing information',
      error: error.message
    });
  }
};

module.exports = {
  getByCommunity,
  getById,
  createBillingInformation,
  updateBillingInformation
};

