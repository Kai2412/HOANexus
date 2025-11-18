const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, getMasterConnection } = require('../config/database');
const { logger } = require('../utils/logger');
const config = require('../config');

const authController = {
  // Login endpoint
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      logger.info('Login attempt', 'AuthController', { username });

      // Get user account from master database
      const masterPool = await getMasterConnection();
      const request = masterPool.request();
      request.input('Username', username);

      // Get user account from master database
      const result = await request.query(`
        SELECT 
          ua.UserAccountID,
          ua.OrganizationID,
          ua.Username,
          ua.Email,
          ua.PasswordHash,
          ua.FirstName,
          ua.LastName,
          ua.StakeholderID,
          ua.MustChangePassword,
          ua.TempPasswordExpiry,
          ua.LastLoginDate,
          ua.FailedLoginAttempts,
          ua.AccountLocked,
          ua.IsActive
        FROM dbo.sec_UserAccounts ua
        WHERE ua.Username = @Username AND ua.IsActive = 1
      `);

      if (result.recordset.length === 0) {
        logger.warn('Login attempt with invalid username', 'AuthController', { username });
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      const userAccount = result.recordset[0];

      // Check if account is locked
      if (userAccount.AccountLocked) {
        logger.warn('Login attempt on locked account', 'AuthController', { username });
        return res.status(401).json({
          success: false,
          message: 'Account is locked. Please contact administrator.'
        });
      }

      // Check if temp password has expired
      if (userAccount.TempPasswordExpiry && new Date(userAccount.TempPasswordExpiry) < new Date()) {
        logger.warn('Login attempt with expired temp password', 'AuthController', { username });
        return res.status(401).json({
          success: false,
          message: 'Temporary password has expired. Please contact administrator to reset your password.'
        });
      }

      // Get stakeholder info from client database if StakeholderID exists
      let stakeholder = null;
      if (userAccount.StakeholderID) {
        try {
          const clientPool = await getConnection();
          const stakeholderRequest = clientPool.request();
          stakeholderRequest.input('StakeholderID', require('mssql').UniqueIdentifier, userAccount.StakeholderID);
          
          const stakeholderResult = await stakeholderRequest.query(`
            SELECT 
              StakeholderID,
              Type,
              SubType,
              AccessLevel,
              Department,
              Title,
              FirstName,
              LastName,
              Email,
              PortalAccessEnabled,
              Status
            FROM dbo.cor_Stakeholders
            WHERE StakeholderID = @StakeholderID AND IsActive = 1
          `);
          
          if (stakeholderResult.recordset.length > 0) {
            stakeholder = stakeholderResult.recordset[0];
            
            // Check if portal access is enabled
            if (!stakeholder.PortalAccessEnabled) {
              logger.warn('Login attempt without portal access', 'AuthController', { username });
              return res.status(401).json({
                success: false,
                message: 'Portal access is not enabled for this account.'
              });
            }
            
            // Check if stakeholder status is Active (block login for all other statuses)
            if (stakeholder.Status && stakeholder.Status !== 'Active') {
              logger.warn('Login attempt with non-active status', 'AuthController', { 
                username, 
                status: stakeholder.Status 
              });
              return res.status(401).json({
                success: false,
                message: `Account access is restricted. Current status: ${stakeholder.Status}`
              });
            }
          }
        } catch (stakeholderError) {
          logger.warn('Could not fetch stakeholder info', 'AuthController', { 
            username, 
            error: stakeholderError.message 
          });
          // Continue without stakeholder info - user can still log in
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userAccount.PasswordHash);

      if (!isValidPassword) {
        // Increment failed login attempts in master database
        const updateRequest = masterPool.request();
        updateRequest.input('UserAccountID', require('mssql').UniqueIdentifier, userAccount.UserAccountID);
        await updateRequest.query(`
          UPDATE dbo.sec_UserAccounts 
          SET FailedLoginAttempts = FailedLoginAttempts + 1
          WHERE UserAccountID = @UserAccountID
        `);

        logger.warn('Login failed - invalid password', 'AuthController', { username });
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Get database name from organization
      let databaseName = null;
      try {
        const orgRequest = masterPool.request();
        orgRequest.input('OrganizationID', require('mssql').UniqueIdentifier, userAccount.OrganizationID);
        const orgResult = await orgRequest.query(`
          SELECT DatabaseName
          FROM dbo.cor_Organizations
          WHERE OrganizationID = @OrganizationID AND IsActive = 1
        `);
        
        if (orgResult.recordset.length > 0) {
          databaseName = orgResult.recordset[0].DatabaseName;
        }
      } catch (orgError) {
        logger.warn('Could not fetch organization database name', 'AuthController', {
          organizationId: userAccount.OrganizationID,
          error: orgError.message
        });
      }

      // Generate JWT token
      const tokenPayload = {
        userId: userAccount.UserAccountID,
        organizationId: userAccount.OrganizationID,
        databaseName: databaseName, // Include database name in JWT
        stakeholderId: userAccount.StakeholderID,
        username: userAccount.Username,
        type: stakeholder?.Type || null,
        subType: stakeholder?.SubType || null,
        accessLevel: stakeholder?.AccessLevel || null
      };

      const token = jwt.sign(tokenPayload, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiresIn
      });

      // Update last login date and reset failed attempts in master database
      const updateLoginRequest = masterPool.request();
      updateLoginRequest.input('UserAccountID', require('mssql').UniqueIdentifier, userAccount.UserAccountID);
      await updateLoginRequest.query(`
        UPDATE dbo.sec_UserAccounts 
        SET LastLoginDate = SYSUTCDATETIME(), FailedLoginAttempts = 0
        WHERE UserAccountID = @UserAccountID
      `);

      // Prepare user data for frontend
      const userData = {
        id: userAccount.UserAccountID,
        organizationId: userAccount.OrganizationID,
        username: userAccount.Username,
        email: userAccount.Email,
        firstName: userAccount.FirstName || stakeholder?.FirstName || null,
        lastName: userAccount.LastName || stakeholder?.LastName || null,
        stakeholderId: userAccount.StakeholderID,
        type: stakeholder?.Type || null,
        subType: stakeholder?.SubType || null,
        accessLevel: stakeholder?.AccessLevel || null,
        department: stakeholder?.Department || null,
        title: stakeholder?.Title || null,
        mustChangePassword: userAccount.MustChangePassword || false
      };

      logger.info('Login successful', 'AuthController', { 
        userId: userAccount.UserAccountID,
        stakeholderId: userAccount.StakeholderID,
        mustChangePassword: userAccount.MustChangePassword
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userData,
        mustChangePassword: userAccount.MustChangePassword || false
      });

    } catch (error) {
      logger.error('Login error', 'AuthController', null, error);
      res.status(500).json({
        success: false,
        message: 'Login failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Verify token and get current user
  async getCurrentUser(req, res) {
    try {
      // This will be called by middleware that already verified the token
      const { stakeholderId } = req.user;

      const pool = await getConnection();
      const request = pool.request();
      request.input('StakeholderID', stakeholderId);

      const result = await request.query(`
        SELECT 
          ua.ID as UserAccountID,
          ua.Username,
          s.ID as StakeholderID,
          s.Type,
          s.SubType, 
          s.AccessLevel,
          s.FirstName,
          s.LastName,
          s.Email,
          s.PortalAccessEnabled,
          s.CommunityID
        FROM sec_UserAccounts ua
        JOIN cor_Stakeholders s ON ua.StakeholderID = s.ID
        WHERE s.ID = @StakeholderID AND ua.IsActive = 1
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userAccount = result.recordset[0];
      
      const userData = {
        id: userAccount.UserAccountID,
        username: userAccount.Username,
        stakeholderId: userAccount.StakeholderID,
        type: userAccount.Type,
        subType: userAccount.SubType,
        accessLevel: userAccount.AccessLevel,
        firstName: userAccount.FirstName,
        lastName: userAccount.LastName,
        email: userAccount.Email,
        communityId: userAccount.CommunityID,
        portalAccessEnabled: userAccount.PortalAccessEnabled
      };

      res.json({
        success: true,
        user: userData
      });

    } catch (error) {
      logger.error('Get current user error', 'AuthController', null, error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  },

  // Logout endpoint
  async logout(req, res) {
    try {
      // For JWT, logout is mainly client-side (remove token)
      // But we can log the event for audit purposes
      logger.info('User logout', 'AuthController', { userId: req.user?.userId });
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error', 'AuthController', null, error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  },

  // Change password endpoint
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { userId } = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      // Get user account from master database
      const masterPool = await getMasterConnection();
      const userRequest = masterPool.request();
      userRequest.input('UserAccountID', require('mssql').UniqueIdentifier, userId);
      
      const userResult = await userRequest.query(`
        SELECT PasswordHash, MustChangePassword
        FROM dbo.sec_UserAccounts
        WHERE UserAccountID = @UserAccountID AND IsActive = 1
      `);

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User account not found'
        });
      }

      const userAccount = userResult.recordset[0];

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, userAccount.PasswordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password using UserAccount model
      const UserAccount = require('../models/userAccount');
      await UserAccount.updatePassword(userId, newPassword);

      logger.info('Password changed successfully', 'AuthController', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error', 'AuthController', null, error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = authController;
