const Community = require('../models/community');
const { logger } = require('../utils/logger');

const isGuid = (value = '') => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);

const getAllCommunities = async (_req, res) => {
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

const getCommunityById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const community = await Community.getById(id);

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

const updatableFields = new Set([
  'PropertyCode',
  'DisplayName',
  'LegalName',
  'ClientType',
  'ServiceType',
  'ManagementType',
  'DevelopmentStage',
  'CommunityStatus',
  'BuiltOutUnits',
  'Market',
  'Office',
  'PreferredContactInfo',
  'Website',
  'Address',
  'Address2',
  'City',
  'State',
  'Zipcode',
  'ContractStart',
  'ContractEnd',
  'TaxID',
  'StateTaxID',
  'SOSFileNumber',
  'TaxReturnType',
  'AcquisitionType',
  'Active'
]);

const createCommunity = async (req, res) => {
  const payload = {};

  // Validate required fields: PropertyCode OR (DisplayName AND LegalName)
  const hasPcode = req.body.PropertyCode && req.body.PropertyCode.trim();
  const hasDisplayName = req.body.DisplayName && req.body.DisplayName.trim();
  const hasLegalName = req.body.LegalName && req.body.LegalName.trim();

  if (!hasPcode && (!hasDisplayName || !hasLegalName)) {
    return res.status(400).json({
      success: false,
      message: 'Either PropertyCode OR both DisplayName and LegalName are required'
    });
  }

  // Filter and prepare payload (same fields as update)
  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!updatableFields.has(key)) {
      return;
    }

    if (key === 'BuiltOutUnits') {
      if (value === '' || value === null || value === undefined) {
        payload[key] = null;
      } else {
        const parsed = Number(value);
        payload[key] = Number.isNaN(parsed) ? null : parsed;
      }
    } else if (key === 'Active') {
      payload[key] = value === true || value === 'true' || value === 1;
    } else if (key === 'ContractStart' || key === 'ContractEnd') {
      payload[key] = value === '' || value === null || value === undefined ? null : value;
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  try {
    // Set CreatedBy from authenticated user
    const newCommunity = await Community.create(payload, req.user?.stakeholderId || null);

    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: newCommunity
    });
  } catch (error) {
    logger.databaseError('create', 'community', error, 'CommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to create community',
      error: error.message
    });
  }
};

const updateCommunity = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  const payload = {};

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!updatableFields.has(key)) {
      return;
    }

    if (key === 'BuiltOutUnits') {
      if (value === '' || value === null || value === undefined) {
        payload[key] = null;
      } else {
        const parsed = Number(value);
        payload[key] = Number.isNaN(parsed) ? null : parsed;
      }
    } else if (key === 'Active') {
      // Convert Active to boolean (handle string "true"/"false", "1"/"0", etc.)
      if (value === true || value === 'true' || value === 1 || value === '1') {
        payload[key] = true;
      } else if (value === false || value === 'false' || value === 0 || value === '0') {
        payload[key] = false;
      } else {
        payload[key] = null;
      }
    } else if (typeof value === 'string') {
      payload[key] = value.trim() === '' ? null : value;
    } else {
      payload[key] = value ?? null;
    }
  });

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update'
    });
  }

  // Always set ModifiedBy from authenticated user
  payload.ModifiedBy = req.user?.stakeholderId || null;
  
  // Debug logging
  logger.debug('Updating community', 'CommunityController', {
    communityId: id,
    stakeholderId: req.user?.stakeholderId,
    userId: req.user?.userId,
    hasUser: !!req.user
  });

  try {
    const updatedCommunity = await Community.update(id, payload);

    if (!updatedCommunity) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Community updated successfully',
      data: updatedCommunity
    });
  } catch (error) {
    // Log full error details for debugging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName,
      procName: error.procName,
      lineNumber: error.lineNumber
    };
    
    logger.error('Community update error:', {
      ...errorDetails,
      communityId: id,
      payload: payload
    });
    logger.databaseError('update', 'community', error, 'CommunityController');
    
    // Return 400 for validation errors, 500 for server errors
    const statusCode = error.message && (
      error.message.includes('required') || 
      error.message.includes('invalid') ||
      error.message.includes('not found') ||
      error.number === 515 || // SQL Server: Cannot insert NULL
      error.number === 547    // SQL Server: Foreign key constraint
    ) ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update community',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
};

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity
};