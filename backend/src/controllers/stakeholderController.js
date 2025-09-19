const Stakeholder = require('../models/stakeholder');
const { logger } = require('../utils/logger');

// Get all stakeholders
const getAllStakeholders = async (req, res) => {
  try {
    const stakeholders = await Stakeholder.getAll();
    res.status(200).json({
      success: true,
      message: 'Stakeholders retrieved successfully',
      data: stakeholders,
      count: stakeholders.length
    });
  } catch (error) {
    logger.databaseError('fetch', 'stakeholders', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stakeholders',
      error: error.message
    });
  }
};

// Get stakeholder by ID
const getStakeholderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID is required'
      });
    }

    const stakeholder = await Stakeholder.getById(parseInt(id));
    
    if (!stakeholder) {
      return res.status(404).json({
        success: false,
        message: 'Stakeholder not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stakeholder retrieved successfully',
      data: stakeholder
    });
  } catch (error) {
    logger.databaseError('fetch', 'stakeholder', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stakeholder',
      error: error.message
    });
  }
};

// Get stakeholders by type
const getStakeholdersByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate stakeholder type
    const validTypes = ['Resident', 'Board Member', 'Property Manager', 'Vendor', 'Emergency Contact'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stakeholder type',
        validTypes: validTypes
      });
    }

    const stakeholders = await Stakeholder.getByType(type);
    
    res.status(200).json({
      success: true,
      message: `${type} stakeholders retrieved successfully`,
      data: stakeholders,
      count: stakeholders.length,
      type: type
    });
  } catch (error) {
    logger.databaseError('fetch', 'stakeholders by type', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stakeholders by type',
      error: error.message
    });
  }
};

// Search stakeholders
const searchStakeholders = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const stakeholders = await Stakeholder.search(q.trim());
    
    res.status(200).json({
      success: true,
      message: `Search results for "${q}"`,
      data: stakeholders,
      count: stakeholders.length,
      searchTerm: q
    });
  } catch (error) {
    logger.databaseError('search', 'stakeholders', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to search stakeholders',
      error: error.message
    });
  }
};

// Create new stakeholder
const createStakeholder = async (req, res) => {
  try {
    const stakeholderData = req.body;
    
    // Validate required fields
    if (!stakeholderData.FirstName) {
      return res.status(400).json({
        success: false,
        message: 'First name is required'
      });
    }

    if (!stakeholderData.LastName) {
      return res.status(400).json({
        success: false,
        message: 'Last name is required'
      });
    }

    if (!stakeholderData.Type) {
      return res.status(400).json({
        success: false,
        message: 'Stakeholder type is required'
      });
    }

    // Validate stakeholder type
    const validTypes = ['Resident', 'Company Employee', 'Vendor', 'Other'];
    if (!validTypes.includes(stakeholderData.Type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stakeholder type',
        validTypes: validTypes
      });
    }

    // Validate email format if provided
    if (stakeholderData.Email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stakeholderData.Email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Validate phone format if provided
    if (stakeholderData.Phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,}$/;
      if (!phoneRegex.test(stakeholderData.Phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    // Validate credit score range if provided
    if (stakeholderData.CreditScore) {
      if (stakeholderData.CreditScore < 300 || stakeholderData.CreditScore > 850) {
        return res.status(400).json({
          success: false,
          message: 'Credit score must be between 300 and 850'
        });
      }
    }

    // Set defaults
    stakeholderData.PreferredContactMethod = stakeholderData.PreferredContactMethod || 'Email';

    // Map controller field names to model field names
    const modelData = {
      Type: stakeholderData.Type,
      SubType: stakeholderData.SubType,
      AccessLevel: stakeholderData.AccessLevel,
      CommunityID: stakeholderData.CommunityID,
      FirstName: stakeholderData.FirstName,
      LastName: stakeholderData.LastName,
      CompanyName: stakeholderData.CompanyName,
      Email: stakeholderData.Email,
      Phone: stakeholderData.Phone,
      MobilePhone: stakeholderData.MobilePhone,
      PreferredContactMethod: stakeholderData.PreferredContactMethod,
      Status: stakeholderData.Status,
      PortalAccessEnabled: stakeholderData.PortalAccessEnabled,
      Notes: stakeholderData.Notes
    };

    const newStakeholder = await Stakeholder.create(modelData);
    
    res.status(201).json({
      success: true,
      message: 'Stakeholder created successfully',
      data: newStakeholder
    });
  } catch (error) {
    logger.databaseError('create', 'stakeholder', error, 'StakeholderController');
    
    // Handle duplicate email errors
    if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        message: 'Stakeholder with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create stakeholder',
      error: error.message
    });
  }
};

// Update stakeholder
const updateStakeholder = async (req, res) => {
  try {
    const { id } = req.params;
    const stakeholderData = req.body;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID is required'
      });
    }

    // Check if stakeholder exists
    const existingStakeholder = await Stakeholder.getById(parseInt(id));
    if (!existingStakeholder) {
      return res.status(404).json({
        success: false,
        message: 'Stakeholder not found'
      });
    }

    // Validate required fields if provided
    if (stakeholderData.FirstName === '') {
      return res.status(400).json({
        success: false,
        message: 'First name cannot be empty'
      });
    }

    if (stakeholderData.LastName === '') {
      return res.status(400).json({
        success: false,
        message: 'Last name cannot be empty'
      });
    }

    // Validate stakeholder type if provided
    if (stakeholderData.Type) {
      const validTypes = ['Resident', 'Company Employee', 'Vendor', 'Other'];
      if (!validTypes.includes(stakeholderData.Type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stakeholder type',
          validTypes: validTypes
        });
      }
    }

    // Validate email format if provided
    if (stakeholderData.Email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stakeholderData.Email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Validate phone format if provided
    if (stakeholderData.Phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,}$/;
      if (!phoneRegex.test(stakeholderData.Phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    // Validate credit score range if provided
    if (stakeholderData.CreditScore) {
      if (stakeholderData.CreditScore < 300 || stakeholderData.CreditScore > 850) {
        return res.status(400).json({
          success: false,
          message: 'Credit score must be between 300 and 850'
        });
      }
    }

    // Map controller field names to model field names
    const modelData = {};
    if (stakeholderData.Type !== undefined) modelData.Type = stakeholderData.Type;
    if (stakeholderData.SubType !== undefined) modelData.SubType = stakeholderData.SubType;
    if (stakeholderData.AccessLevel !== undefined) modelData.AccessLevel = stakeholderData.AccessLevel;
    if (stakeholderData.CommunityID !== undefined) modelData.CommunityID = stakeholderData.CommunityID;
    if (stakeholderData.FirstName !== undefined) modelData.FirstName = stakeholderData.FirstName;
    if (stakeholderData.LastName !== undefined) modelData.LastName = stakeholderData.LastName;
    if (stakeholderData.CompanyName !== undefined) modelData.CompanyName = stakeholderData.CompanyName;
    if (stakeholderData.Email !== undefined) modelData.Email = stakeholderData.Email;
    if (stakeholderData.Phone !== undefined) modelData.Phone = stakeholderData.Phone;
    if (stakeholderData.MobilePhone !== undefined) modelData.MobilePhone = stakeholderData.MobilePhone;
    if (stakeholderData.PreferredContactMethod !== undefined) modelData.PreferredContactMethod = stakeholderData.PreferredContactMethod;
    if (stakeholderData.Status !== undefined) modelData.Status = stakeholderData.Status;
    if (stakeholderData.PortalAccessEnabled !== undefined) modelData.PortalAccessEnabled = stakeholderData.PortalAccessEnabled;
    if (stakeholderData.Notes !== undefined) modelData.Notes = stakeholderData.Notes;

    const updatedStakeholder = await Stakeholder.update(parseInt(id), modelData);
    
    res.status(200).json({
      success: true,
      message: 'Stakeholder updated successfully',
      data: updatedStakeholder
    });
  } catch (error) {
    logger.databaseError('update', 'stakeholder', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to update stakeholder',
      error: error.message
    });
  }
};

// Delete stakeholder (soft delete)
const deleteStakeholder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID is required'
      });
    }

    // Check if stakeholder exists
    const existingStakeholder = await Stakeholder.getById(parseInt(id));
    if (!existingStakeholder) {
      return res.status(404).json({
        success: false,
        message: 'Stakeholder not found'
      });
    }

    await Stakeholder.delete(parseInt(id));
    
    res.status(200).json({
      success: true,
      message: 'Stakeholder deleted successfully'
    });
  } catch (error) {
    logger.databaseError('delete', 'stakeholder', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete stakeholder',
      error: error.message
    });
  }
};

// Get stakeholder with properties
const getStakeholderWithProperties = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID is required'
      });
    }

    const stakeholderWithProperties = await Stakeholder.getStakeholderWithProperties(parseInt(id));
    
    if (!stakeholderWithProperties || stakeholderWithProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stakeholder not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stakeholder with properties retrieved successfully',
      data: stakeholderWithProperties
    });
  } catch (error) {
    logger.databaseError('fetch', 'stakeholder with properties', error, 'StakeholderController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stakeholder with properties',
      error: error.message
    });
  }
};

module.exports = {
  getAllStakeholders,
  getStakeholderById,
  getStakeholdersByType,
  searchStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
  getStakeholderWithProperties
};