const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');
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

      const pool = await getConnection();
      const request = pool.request();
      request.input('Username', username);

      // Get user account with stakeholder info
      const result = await request.query(`
        SELECT 
          ua.ID as UserAccountID,
          ua.Username,
          ua.PasswordHash,
          ua.LastLoginDate,
          ua.FailedLoginAttempts,
          ua.AccountLocked,
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

      // Check if portal access is enabled
      if (!userAccount.PortalAccessEnabled) {
        logger.warn('Login attempt without portal access', 'AuthController', { username });
        return res.status(401).json({
          success: false,
          message: 'Portal access is not enabled for this account.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userAccount.PasswordHash);

      if (!isValidPassword) {
        // Increment failed login attempts
        const updateRequest = pool.request();
        updateRequest.input('UserAccountID', userAccount.UserAccountID);
        await updateRequest.query(`
          UPDATE sec_UserAccounts 
          SET FailedLoginAttempts = FailedLoginAttempts + 1
          WHERE ID = @UserAccountID
        `);

        logger.warn('Login failed - invalid password', 'AuthController', { username });
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Generate JWT token
      const tokenPayload = {
        userId: userAccount.UserAccountID,
        stakeholderId: userAccount.StakeholderID,
        username: userAccount.Username,
        type: userAccount.Type,
        subType: userAccount.SubType,
        accessLevel: userAccount.AccessLevel
      };

      const token = jwt.sign(tokenPayload, config.auth.jwtSecret, {
        expiresIn: config.auth.jwtExpiresIn
      });

      // Update last login date and reset failed attempts
      const updateLoginRequest = pool.request();
      updateLoginRequest.input('UserAccountID', userAccount.UserAccountID);
      await updateLoginRequest.query(`
        UPDATE sec_UserAccounts 
        SET LastLoginDate = GETDATE(), FailedLoginAttempts = 0
        WHERE ID = @UserAccountID
      `);

      // Prepare user data for frontend
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

      logger.info('Login successful', 'AuthController', { 
        userId: userAccount.UserAccountID,
        stakeholderId: userAccount.StakeholderID,
        type: userAccount.Type 
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userData
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
  }
};

module.exports = authController;
