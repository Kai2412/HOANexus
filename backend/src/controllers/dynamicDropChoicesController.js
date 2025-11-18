const DynamicDropChoices = require('../models/dynamicDropChoices');
const { logger } = require('../utils/logger');

const getDynamicDropChoices = async (req, res) => {
  const { groupId, groupIds, includeInactive } = req.query;

  // Support both single groupId and comma-separated groupIds
  let groups = [];
  if (groupId) {
    groups = [groupId];
  } else if (groupIds) {
    groups = groupIds.split(',').map((item) => item.trim()).filter(Boolean);
  }

  // Legacy support: table/column parameters
  const { table, column } = req.query;
  if (table && column && groups.length === 0) {
    const columns = column.split(',').map((item) => item.trim()).filter(Boolean);
    try {
      const includeInactiveFlag = includeInactive === 'true';
      const results = await Promise.all(
        columns.map(async (columnName) => {
          const choices = await DynamicDropChoices.getByColumn(table, columnName, includeInactiveFlag);
          return [columnName, choices];
        })
      );
      const data = Object.fromEntries(results);
      return res.status(200).json({
        success: true,
        message: 'Dynamic drop choices retrieved successfully',
        data,
        count: columns.length
      });
    } catch (error) {
      logger.databaseError('fetch', 'dynamic drop choices', error, 'DynamicDropChoicesController');
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve dynamic drop choices',
        error: error.message
      });
    }
  }

  if (groups.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter "groupId" or "groupIds" is required'
    });
  }

  try {
    const includeInactiveFlag = includeInactive === 'true';
    const results = await Promise.all(
      groups.map(async (gId) => {
        const choices = await DynamicDropChoices.getByGroup(gId, includeInactiveFlag);
        return [gId, choices];
      })
    );

    const data = Object.fromEntries(results);

    res.status(200).json({
      success: true,
      message: 'Dynamic drop choices retrieved successfully',
      data,
      count: groups.length
    });
  } catch (error) {
    logger.databaseError('fetch', 'dynamic drop choices', error, 'DynamicDropChoicesController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dynamic drop choices',
      error: error.message
    });
  }
};

const createDynamicDropChoice = async (req, res) => {
  const { groupId, choiceValue, displayOrder, isDefault, isActive } = req.body;
  const { stakeholderId } = req.user || {};

  // Legacy support: tableName/columnName
  const { tableName, columnName } = req.body;
  let finalGroupId = groupId;

  if (!finalGroupId && tableName && columnName) {
    // Map old table/column to new group IDs
    const groupMapping = {
      'cor_Communities': {
        'ClientType': 'client-types',
        'ServiceType': 'service-types',
        'ManagementType': 'management-types',
        'DevelopmentStage': 'development-stages',
        'AcquisitionType': 'acquisition-types'
      },
      'cor_Stakeholders': {
        'Type': 'stakeholder-types',
        'SubType': 'stakeholder-subtypes', // Will need parent type to determine exact group
        'AccessLevel': 'access-levels',
        'PreferredContactMethod': 'preferred-contact-methods',
        'Status': 'status'
      }
    };
    finalGroupId = groupMapping[tableName]?.[columnName];
  }

  if (!finalGroupId || !choiceValue) {
    return res.status(400).json({
      success: false,
      message: 'groupId (or tableName/columnName) and choiceValue are required'
    });
  }

  if (!stakeholderId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  // Block creation of new choices for system-managed groups
  const systemManagedGroups = [
    'stakeholder-types',
    'access-levels'
  ];

  if (systemManagedGroups.includes(finalGroupId)) {
    return res.status(403).json({
      success: false,
      message: `Cannot create new choices for ${finalGroupId}. This group is system-managed and required for core functionality.`
    });
  }

  try {
    // Get current max display order if not provided
    let order = displayOrder;
    if (order === undefined || order === null) {
      const existing = await DynamicDropChoices.getByGroup(finalGroupId, true);
      order = existing.length > 0 ? Math.max(...existing.map(c => c.DisplayOrder || 0)) + 1 : 1;
    }

    const choice = await DynamicDropChoices.create({
      groupId: finalGroupId,
      choiceValue,
      displayOrder: order,
      isDefault: isDefault || false,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: stakeholderId
    });

    res.status(201).json({
      success: true,
      message: 'Dynamic drop choice created successfully',
      data: choice
    });
  } catch (error) {
    logger.databaseError('create', 'dynamic drop choice', error, 'DynamicDropChoicesController');
    res.status(500).json({
      success: false,
      message: 'Failed to create dynamic drop choice',
      error: error.message
    });
  }
};

const updateDynamicDropChoice = async (req, res) => {
  const { choiceId } = req.params;
  const { choiceValue, displayOrder, isDefault, isActive } = req.body;
  const { stakeholderId } = req.user || {};

  if (!choiceId) {
    return res.status(400).json({
      success: false,
      message: 'choiceId is required'
    });
  }

  if (!stakeholderId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  try {
    // Check if choice is system-managed
    const existingChoice = await DynamicDropChoices.getById(choiceId);
    if (!existingChoice) {
      return res.status(404).json({
        success: false,
        message: 'Choice not found'
      });
    }

    if (existingChoice.IsSystemManaged) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system-managed choices. These are protected for system functionality.'
      });
    }

    const updateData = {};
    if (choiceValue !== undefined) updateData.choiceValue = choiceValue;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Handle isDefault - ensure only one default per group
    if (isDefault !== undefined) {
      if (isDefault) {
        // If setting this as default, unset all other defaults in the same group
        await DynamicDropChoices.clearOtherDefaults(
          existingChoice.GroupID,
          choiceId
        );
      }
      updateData.isDefault = isDefault;
    }
    
    updateData.modifiedBy = stakeholderId;

    const choice = await DynamicDropChoices.update(choiceId, updateData);

    res.status(200).json({
      success: true,
      message: 'Dynamic drop choice updated successfully',
      data: choice
    });
  } catch (error) {
    logger.databaseError('update', 'dynamic drop choice', error, 'DynamicDropChoicesController');
    res.status(500).json({
      success: false,
      message: 'Failed to update dynamic drop choice',
      error: error.message
    });
  }
};

const toggleActiveStatus = async (req, res) => {
  const { choiceId } = req.params;
  const { isActive } = req.body;
  const { stakeholderId } = req.user || {};

  if (!choiceId) {
    return res.status(400).json({
      success: false,
      message: 'choiceId is required'
    });
  }

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      message: 'isActive is required'
    });
  }

  if (!stakeholderId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  try {
    // Check if choice is system-managed
    const existingChoice = await DynamicDropChoices.getById(choiceId);
    if (!existingChoice) {
      return res.status(404).json({
        success: false,
        message: 'Choice not found'
      });
    }

    if (existingChoice.IsSystemManaged) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system-managed choices. These are protected for system functionality.'
      });
    }

    const choice = await DynamicDropChoices.update(choiceId, {
      isActive: isActive,
      modifiedBy: stakeholderId
    });

    res.status(200).json({
      success: true,
      message: `Choice ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: choice
    });
  } catch (error) {
    logger.databaseError('toggle active status', 'dynamic drop choice', error, 'DynamicDropChoicesController');
    res.status(500).json({
      success: false,
      message: 'Failed to toggle active status',
      error: error.message
    });
  }
};

const bulkUpdateOrder = async (req, res) => {
  const { groupId, choices } = req.body;
  const { stakeholderId } = req.user || {};

  // Legacy support: tableName/columnName
  const { tableName, columnName } = req.body;
  let finalGroupId = groupId;

  if (!finalGroupId && tableName && columnName) {
    // Map old table/column to new group IDs
    const groupMapping = {
      'cor_Communities': {
        'ClientType': 'client-types',
        'ServiceType': 'service-types',
        'ManagementType': 'management-types',
        'DevelopmentStage': 'development-stages',
        'AcquisitionType': 'acquisition-types'
      },
      'cor_Stakeholders': {
        'Type': 'stakeholder-types',
        'SubType': 'stakeholder-subtypes',
        'AccessLevel': 'access-levels',
        'PreferredContactMethod': 'preferred-contact-methods',
        'Status': 'status'
      }
    };
    finalGroupId = groupMapping[tableName]?.[columnName];
  }

  if (!finalGroupId || !Array.isArray(choices)) {
    return res.status(400).json({
      success: false,
      message: 'groupId (or tableName/columnName) and choices array are required'
    });
  }

  if (!stakeholderId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  try {
    await DynamicDropChoices.bulkUpdateOrder(finalGroupId, choices, stakeholderId);

    res.status(200).json({
      success: true,
      message: 'Display order updated successfully'
    });
  } catch (error) {
    logger.databaseError('bulk update order', 'dynamic drop choices', error, 'DynamicDropChoicesController');
    res.status(500).json({
      success: false,
      message: 'Failed to update display order',
      error: error.message
    });
  }
};

module.exports = {
  getDynamicDropChoices,
  createDynamicDropChoice,
  updateDynamicDropChoice,
  toggleActiveStatus,
  bulkUpdateOrder
};

