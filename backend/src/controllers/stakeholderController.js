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
    
    // Validate GUID format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !guidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID (GUID) is required'
      });
    }

    const stakeholder = await Stakeholder.getById(id);
    
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

    // Type validation removed - now using dynamic dropdowns from cor_DynamicDropChoices
    // The database will store the text value (ChoiceValue) directly

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

    // Validate email is required if portal access is enabled
    if (stakeholderData.PortalAccessEnabled && !stakeholderData.Email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required when portal access is enabled'
      });
    }

    // Map controller field names to model field names
    const modelData = {
      Type: stakeholderData.Type,
      SubType: stakeholderData.SubType,
      AccessLevel: stakeholderData.AccessLevel,
      Department: stakeholderData.Department,
      Title: stakeholderData.Title,
      FirstName: stakeholderData.FirstName,
      LastName: stakeholderData.LastName,
      CompanyName: stakeholderData.CompanyName,
      Email: stakeholderData.Email,
      Phone: stakeholderData.Phone,
      MobilePhone: stakeholderData.MobilePhone,
      PreferredContactMethod: stakeholderData.PreferredContactMethod,
      Status: stakeholderData.Status,
      PortalAccessEnabled: stakeholderData.PortalAccessEnabled || false,
      Notes: stakeholderData.Notes,
      CreatedBy: req.user?.stakeholderId || null
    };
    
    // Debug logging
    logger.debug('Creating stakeholder', 'StakeholderController', {
      createdBy: req.user?.stakeholderId,
      userId: req.user?.userId,
      hasUser: !!req.user
    });

    // Create stakeholder in client database
    const newStakeholder = await Stakeholder.create(modelData);
    
    // Auto-create UserAccount in master database if portal access is enabled
    if (newStakeholder.PortalAccessEnabled && newStakeholder.Email) {
      try {
        const UserAccount = require('../models/userAccount');
        const { getCurrentOrganizationId } = require('../utils/organizationHelper');
        
        // Get OrganizationID for current client database
        const organizationId = await getCurrentOrganizationId();
        
        if (!organizationId) {
          logger.warn('Could not find organization ID for database', 'StakeholderController', {
            database: require('../config').database.database
          });
          // Continue without creating account - IT can link manually later
        } else {
          // Create UserAccount in master database
          const userAccount = await UserAccount.create({
            organizationId,
            email: newStakeholder.Email,
            stakeholderId: newStakeholder.StakeholderID,
            firstName: newStakeholder.FirstName,
            lastName: newStakeholder.LastName
          });
          
          // Log temp password for dev (console)
          console.log('\n========================================');
          console.log('NEW USER ACCOUNT CREATED');
          console.log('========================================');
          console.log(`Email: ${userAccount.Email}`);
          console.log(`Temp Password: ${userAccount.tempPassword}`);
          console.log(`Stakeholder ID: ${newStakeholder.StakeholderID}`);
          console.log('========================================\n');
          
          logger.info('Auto-created user account for stakeholder', 'StakeholderController', {
            stakeholderId: newStakeholder.StakeholderID,
            userAccountId: userAccount.UserAccountID,
            email: newStakeholder.Email
          });
        }
      } catch (accountError) {
        // Log error but don't fail stakeholder creation
        logger.error('Failed to auto-create user account', 'StakeholderController', null, accountError);
        // Continue - stakeholder is created, account can be created manually
      }
    }
    
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
    
    // Validate GUID format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !guidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID (GUID) is required'
      });
    }

    // Check if stakeholder exists
    const existingStakeholder = await Stakeholder.getById(id);
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

    // Type validation removed - now using dynamic dropdowns from cor_DynamicDropChoices
    // The database will store the text value (ChoiceValue) directly

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

    // ============================================
    // PORTAL ACCESS & EMAIL VALIDATION LOGIC
    // ============================================
    const UserAccount = require('../models/userAccount');
    const { getCurrentOrganizationId } = require('../utils/organizationHelper');
    const { getConnection } = require('../config/database');
    const { sql } = require('../config/database');

    // Check if email is changing
    const emailChanged = stakeholderData.Email !== undefined && 
                         stakeholderData.Email !== existingStakeholder.Email;
    
    // Check if portal access is being toggled
    const portalAccessToggled = stakeholderData.PortalAccessEnabled !== undefined &&
                                stakeholderData.PortalAccessEnabled !== existingStakeholder.PortalAccessEnabled;
    
    const portalAccessEnabled = stakeholderData.PortalAccessEnabled !== undefined 
      ? stakeholderData.PortalAccessEnabled 
      : existingStakeholder.PortalAccessEnabled;
    
    const newEmail = stakeholderData.Email !== undefined 
      ? stakeholderData.Email 
      : existingStakeholder.Email;

    // Validate email uniqueness if email is changing
    if (emailChanged && newEmail) {
      // Check master database (UserAccounts)
      const existingUserAccount = await UserAccount.findByEmailIncludingInactive(newEmail);
      if (existingUserAccount) {
        // If account exists but isn't linked to this stakeholder, we can link it
        if (existingUserAccount.StakeholderID && existingUserAccount.StakeholderID !== id) {
          return res.status(409).json({
            success: false,
            message: 'This email address is already in use by another account. Please use a different email address.'
          });
        }
        // If account exists but isn't linked, we'll link it later
      }

      // Check client database (Stakeholders with portal access)
      const pool = await getConnection();
      const stakeholderCheck = await pool.request()
        .input('Email', sql.NVarChar(255), newEmail)
        .input('StakeholderID', sql.UniqueIdentifier, id)
        .query(`
          SELECT StakeholderID, Email, PortalAccessEnabled
          FROM dbo.cor_Stakeholders
          WHERE Email = @Email 
            AND StakeholderID != @StakeholderID
            AND PortalAccessEnabled = 1
            AND IsActive = 1
        `);
      
      if (stakeholderCheck.recordset.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This email address is already in use by another stakeholder with portal access. Please use a different email address.'
        });
      }
    }

    // Validate email required when enabling portal access
    if (portalAccessToggled && stakeholderData.PortalAccessEnabled && !newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required when portal access is enabled'
      });
    }

    // Map controller field names to model field names
    const modelData = {};
    if (stakeholderData.Type !== undefined) modelData.Type = stakeholderData.Type;
    if (stakeholderData.SubType !== undefined) modelData.SubType = stakeholderData.SubType;
    if (stakeholderData.AccessLevel !== undefined) modelData.AccessLevel = stakeholderData.AccessLevel;
    if (stakeholderData.Department !== undefined) modelData.Department = stakeholderData.Department;
    if (stakeholderData.Title !== undefined) modelData.Title = stakeholderData.Title;
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
    
    // Always set ModifiedBy from authenticated user
    modelData.ModifiedBy = req.user?.stakeholderId || null;
    
    // Debug logging
    logger.debug('Updating stakeholder', 'StakeholderController', {
      stakeholderId: id,
      modifiedBy: req.user?.stakeholderId,
      userId: req.user?.userId,
      hasUser: !!req.user
    });

    const updatedStakeholder = await Stakeholder.update(id, modelData);
    
    // ============================================
    // HANDLE USER ACCOUNT OPERATIONS
    // ============================================
    try {
      const organizationId = await getCurrentOrganizationId();
      
      if (!organizationId) {
        logger.warn('Could not find organization ID for database', 'StakeholderController', {
          stakeholderId: id
        });
      } else {
        // Check if UserAccount exists for this stakeholder
        let userAccount = await UserAccount.findByStakeholderId(id, true); // Include inactive
        
        // Handle Portal Access Toggle
        if (portalAccessToggled) {
          if (stakeholderData.PortalAccessEnabled) {
            // Portal access enabled: create or reactivate account
            if (userAccount) {
              // Reactivate existing account
              await UserAccount.reactivate(userAccount.UserAccountID);
              
              // Update email if it changed
              if (emailChanged && newEmail) {
                await UserAccount.updateEmail(userAccount.UserAccountID, newEmail);
              }
              
              logger.info('Reactivated user account for stakeholder', 'StakeholderController', {
                stakeholderId: id,
                userAccountId: userAccount.UserAccountID,
                email: newEmail
              });
            } else {
              // Create new account
              if (newEmail) {
                // Check if account exists with this email (unlinked)
                const existingAccountByEmail = await UserAccount.findByEmailIncludingInactive(newEmail);
                if (existingAccountByEmail && !existingAccountByEmail.StakeholderID) {
                  // Link existing account
                  await UserAccount.linkToStakeholder(existingAccountByEmail.UserAccountID, id);
                  await UserAccount.reactivate(existingAccountByEmail.UserAccountID);
                  userAccount = existingAccountByEmail;
                  
                  logger.info('Linked existing user account to stakeholder', 'StakeholderController', {
                    stakeholderId: id,
                    userAccountId: existingAccountByEmail.UserAccountID,
                    email: newEmail
                  });
                } else {
                  // Create new account
                  userAccount = await UserAccount.create({
                    organizationId,
                    email: newEmail,
                    stakeholderId: id,
                    firstName: updatedStakeholder.FirstName,
                    lastName: updatedStakeholder.LastName
                  });
                  
                  // Log temp password for dev (console)
                  console.log('\n========================================');
                  console.log('NEW USER ACCOUNT CREATED');
                  console.log('========================================');
                  console.log(`Email: ${userAccount.Email}`);
                  console.log(`Temp Password: ${userAccount.tempPassword}`);
                  console.log(`Stakeholder ID: ${id}`);
                  console.log('========================================\n');
                  
                  logger.info('Created new user account for stakeholder', 'StakeholderController', {
                    stakeholderId: id,
                    userAccountId: userAccount.UserAccountID,
                    email: newEmail
                  });
                }
              }
            }
          } else {
            // Portal access disabled: deactivate account (soft delete)
            if (userAccount) {
              await UserAccount.deactivate(userAccount.UserAccountID);
              logger.info('Deactivated user account for stakeholder', 'StakeholderController', {
                stakeholderId: id,
                userAccountId: userAccount.UserAccountID
              });
            }
          }
        } else if (emailChanged && portalAccessEnabled && userAccount) {
          // Email changed but portal access still enabled: update UserAccount email
          await UserAccount.updateEmail(userAccount.UserAccountID, newEmail);
          logger.info('Updated user account email for stakeholder', 'StakeholderController', {
            stakeholderId: id,
            userAccountId: userAccount.UserAccountID,
            oldEmail: existingStakeholder.Email,
            newEmail: newEmail
          });
        } else if (emailChanged && portalAccessEnabled && !userAccount && newEmail) {
          // Email changed, portal access enabled, but no account exists: create one
          userAccount = await UserAccount.create({
            organizationId,
            email: newEmail,
            stakeholderId: id,
            firstName: updatedStakeholder.FirstName,
            lastName: updatedStakeholder.LastName
          });
          
          // Log temp password for dev (console)
          console.log('\n========================================');
          console.log('NEW USER ACCOUNT CREATED (Email Change)');
          console.log('========================================');
          console.log(`Email: ${userAccount.Email}`);
          console.log(`Temp Password: ${userAccount.tempPassword}`);
          console.log(`Stakeholder ID: ${id}`);
          console.log('========================================\n');
          
          logger.info('Created user account after email change', 'StakeholderController', {
            stakeholderId: id,
            userAccountId: userAccount.UserAccountID,
            email: newEmail
          });
        }
      }
    } catch (accountError) {
      // Log error but don't fail stakeholder update
      logger.error('Failed to handle user account operations', 'StakeholderController', null, accountError);
      // Continue - stakeholder is updated, account operations can be retried
    }
    
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
    
    // Validate GUID format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !guidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID (GUID) is required'
      });
    }

    // Check if stakeholder exists
    const existingStakeholder = await Stakeholder.getById(id);
    if (!existingStakeholder) {
      return res.status(404).json({
        success: false,
        message: 'Stakeholder not found'
      });
    }

    await Stakeholder.delete(id);
    
    // Deactivate UserAccount if it exists (soft delete)
    try {
      const UserAccount = require('../models/userAccount');
      const userAccount = await UserAccount.findByStakeholderId(id, true); // Include inactive
      if (userAccount) {
        await UserAccount.deactivate(userAccount.UserAccountID);
        logger.info('Deactivated user account after stakeholder soft-delete', 'StakeholderController', {
          stakeholderId: id,
          userAccountId: userAccount.UserAccountID
        });
      }
    } catch (accountError) {
      // Log error but don't fail stakeholder deletion
      logger.error('Failed to deactivate user account after stakeholder deletion', 'StakeholderController', null, accountError);
    }
    
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
    
    // Validate GUID format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !guidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid stakeholder ID (GUID) is required'
      });
    }

    const stakeholderWithProperties = await Stakeholder.getStakeholderWithProperties(id);
    
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