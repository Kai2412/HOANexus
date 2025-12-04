const FeeMaster = require('../models/feeMaster');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

// Get all fees
const getAll = async (req, res) => {
  try {
    const fees = await FeeMaster.getAll();
    res.status(200).json({
      success: true,
      data: fees
    });
  } catch (error) {
    logger.databaseError('fetch', 'all fee master records', error, 'FeeMasterController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fees',
      error: error.message
    });
  }
};

// Get fee by ID
const getById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid fee ID is required'
    });
  }

  try {
    const fee = await FeeMaster.getById(id);
    
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fee
    });
  } catch (error) {
    logger.databaseError('fetch', 'fee master by ID', error, 'FeeMasterController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee',
      error: error.message
    });
  }
};

// Create fee
const createFee = async (req, res) => {
  const payload = {};

  // Allowed fields for creation
  const allowedFields = new Set([
    'FeeName',
    'DefaultAmount',
    'DisplayOrder',
    'IsActive'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'DefaultAmount') {
      const parsed = parseFloat(value);
      payload[key] = isNaN(parsed) ? null : parsed;
    } else if (key === 'DisplayOrder') {
      const parsed = parseInt(value, 10);
      payload[key] = isNaN(parsed) ? undefined : parsed;
    } else if (key === 'IsActive') {
      payload[key] = value === true || value === 'true' || value === 1 || value === '1';
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  // Validate required fields
  if (!payload.FeeName || !payload.FeeName.trim()) {
    return res.status(400).json({
      success: false,
      message: 'FeeName is required'
    });
  }

  if (payload.DefaultAmount === null || payload.DefaultAmount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'DefaultAmount is required'
    });
  }

  try {
    const newFee = await FeeMaster.create(payload, req.user?.stakeholderId || null);

    res.status(201).json({
      success: true,
      message: 'Fee created successfully',
      data: newFee
    });
  } catch (error) {
    logger.databaseError('create', 'fee master', error, 'FeeMasterController');
    res.status(500).json({
      success: false,
      message: 'Failed to create fee',
      error: error.message
    });
  }
};

// Update fee
const updateFee = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid fee ID is required'
    });
  }

  const payload = {};

  // Allowed fields for update
  const allowedFields = new Set([
    'FeeName',
    'DefaultAmount',
    'DisplayOrder',
    'IsActive'
  ]);

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (!allowedFields.has(key)) {
      return;
    }

    if (key === 'DefaultAmount') {
      const parsed = parseFloat(value);
      payload[key] = isNaN(parsed) ? null : parsed;
    } else if (key === 'DisplayOrder') {
      const parsed = parseInt(value, 10);
      payload[key] = isNaN(parsed) ? undefined : parsed;
    } else if (key === 'IsActive') {
      payload[key] = value === true || value === 'true' || value === 1 || value === '1';
    } else {
      payload[key] = value === '' ? null : value;
    }
  });

  try {
    const updatedFee = await FeeMaster.update(id, payload, req.user?.stakeholderId || null);

    if (!updatedFee) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fee updated successfully',
      data: updatedFee
    });
  } catch (error) {
    logger.databaseError('update', 'fee master', error, 'FeeMasterController');
    res.status(500).json({
      success: false,
      message: 'Failed to update fee',
      error: error.message
    });
  }
};

// Delete fee (soft delete)
const deleteFee = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid fee ID is required'
    });
  }

  try {
    await FeeMaster.delete(id);

    res.status(200).json({
      success: true,
      message: 'Fee deleted successfully'
    });
  } catch (error) {
    logger.databaseError('delete', 'fee master', error, 'FeeMasterController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete fee',
      error: error.message
    });
  }
};

// Bulk update display order
const bulkUpdateOrder = async (req, res) => {
  const { feeOrders } = req.body;

  if (!Array.isArray(feeOrders)) {
    return res.status(400).json({
      success: false,
      message: 'feeOrders must be an array'
    });
  }

  // Validate each order entry
  for (const order of feeOrders) {
    if (!order.feeMasterId || !isGuid(order.feeMasterId)) {
      return res.status(400).json({
        success: false,
        message: 'Each feeOrder must have a valid feeMasterId'
      });
    }
    if (order.displayOrder === undefined || order.displayOrder === null) {
      return res.status(400).json({
        success: false,
        message: 'Each feeOrder must have a displayOrder'
      });
    }
  }

  try {
    await FeeMaster.bulkUpdateOrder(feeOrders);

    res.status(200).json({
      success: true,
      message: 'Fee order updated successfully'
    });
  } catch (error) {
    logger.databaseError('bulk update order', 'fee master', error, 'FeeMasterController');
    res.status(500).json({
      success: false,
      message: 'Failed to update fee order',
      error: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  createFee,
  updateFee,
  deleteFee,
  bulkUpdateOrder
};

