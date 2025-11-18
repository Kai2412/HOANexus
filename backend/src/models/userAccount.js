const { sql, getMasterConnection } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateTempPassword } = require('../utils/passwordGenerator');
const config = require('../config');

/**
 * UserAccount Model
 * Handles operations on the master database's sec_UserAccounts table
 */
class UserAccount {
  /**
   * Create a new user account in the master database
   * @param {Object} userData - User account data
   * @param {string} userData.organizationId - Organization GUID
   * @param {string} userData.email - Email address (used as username)
   * @param {string} userData.stakeholderId - Stakeholder GUID from client DB
   * @param {string} userData.firstName - First name (optional)
   * @param {string} userData.lastName - Last name (optional)
   * @param {string} userData.tempPassword - Temporary password (optional, will generate if not provided)
   * @returns {Promise<Object>} Created user account
   */
  static async create(userData) {
    try {
      const pool = await getMasterConnection();
      
      // Generate temp password if not provided
      const tempPassword = userData.tempPassword || generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, config.auth.bcryptRounds);
      
      // Set temp password expiry (7 days from now)
      const tempPasswordExpiry = new Date();
      tempPasswordExpiry.setDate(tempPasswordExpiry.getDate() + 7);
      
      const result = await pool.request()
        .input('OrganizationID', sql.UniqueIdentifier, userData.organizationId)
        .input('Username', sql.NVarChar(255), userData.email)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('Email', sql.NVarChar(255), userData.email)
        .input('FirstName', sql.NVarChar(100), userData.firstName || null)
        .input('LastName', sql.NVarChar(100), userData.lastName || null)
        .input('StakeholderID', sql.UniqueIdentifier, userData.stakeholderId || null)
        .input('MustChangePassword', sql.Bit, true)
        .input('TempPasswordExpiry', sql.DateTime2, tempPasswordExpiry)
        .query(`
          INSERT INTO dbo.sec_UserAccounts (
            OrganizationID, Username, PasswordHash, Email, FirstName, LastName,
            StakeholderID, MustChangePassword, TempPasswordExpiry, IsActive
          )
          OUTPUT INSERTED.UserAccountID, INSERTED.Username, INSERTED.Email,
                 INSERTED.MustChangePassword, INSERTED.TempPasswordExpiry
          VALUES (
            @OrganizationID, @Username, @PasswordHash, @Email, @FirstName, @LastName,
            @StakeholderID, @MustChangePassword, @TempPasswordExpiry, 1
          )
        `);
      
      const userAccount = result.recordset[0];
      
      // Return user account with the temp password (for email notification)
      return {
        ...userAccount,
        tempPassword, // Include for email notification (remove before returning to client)
      };
    } catch (error) {
      throw new Error(`Error creating user account: ${error.message}`);
    }
  }

  /**
   * Find user account by email/username
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User account or null
   */
  static async findByEmail(email) {
    try {
      const pool = await getMasterConnection();
      const result = await pool.request()
        .input('Email', sql.NVarChar(255), email)
        .query(`
          SELECT 
            UserAccountID, OrganizationID, Username, Email, FirstName, LastName,
            StakeholderID, MustChangePassword, TempPasswordExpiry, IsActive,
            LastLoginDate, FailedLoginAttempts, AccountLocked
          FROM dbo.sec_UserAccounts
          WHERE Email = @Email AND IsActive = 1
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      throw new Error(`Error finding user account: ${error.message}`);
    }
  }

  /**
   * Find user account by StakeholderID
   * @param {string} stakeholderId - Stakeholder GUID
   * @param {boolean} includeInactive - Include inactive accounts (default: false)
   * @returns {Promise<Object|null>} User account or null
   */
  static async findByStakeholderId(stakeholderId, includeInactive = false) {
    try {
      const pool = await getMasterConnection();
      const query = includeInactive
        ? `
          SELECT 
            UserAccountID, OrganizationID, Username, Email, FirstName, LastName,
            StakeholderID, MustChangePassword, TempPasswordExpiry, IsActive
          FROM dbo.sec_UserAccounts
          WHERE StakeholderID = @StakeholderID
        `
        : `
          SELECT 
            UserAccountID, OrganizationID, Username, Email, FirstName, LastName,
            StakeholderID, MustChangePassword, TempPasswordExpiry, IsActive
          FROM dbo.sec_UserAccounts
          WHERE StakeholderID = @StakeholderID AND IsActive = 1
        `;
      
      const result = await pool.request()
        .input('StakeholderID', sql.UniqueIdentifier, stakeholderId)
        .query(query);
      
      return result.recordset[0] || null;
    } catch (error) {
      throw new Error(`Error finding user account by stakeholder ID: ${error.message}`);
    }
  }

  /**
   * Find user account by email/username (including inactive accounts)
   * Used for validation checks to prevent duplicate emails
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User account or null
   */
  static async findByEmailIncludingInactive(email) {
    try {
      const pool = await getMasterConnection();
      const result = await pool.request()
        .input('Email', sql.NVarChar(255), email)
        .query(`
          SELECT 
            UserAccountID, OrganizationID, Username, Email, FirstName, LastName,
            StakeholderID, MustChangePassword, TempPasswordExpiry, IsActive,
            LastLoginDate, FailedLoginAttempts, AccountLocked
          FROM dbo.sec_UserAccounts
          WHERE Email = @Email
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      throw new Error(`Error finding user account by email: ${error.message}`);
    }
  }

  /**
   * Update email/username for a user account
   * @param {string} userAccountId - User account GUID
   * @param {string} newEmail - New email address (also updates Username)
   * @returns {Promise<void>}
   */
  static async updateEmail(userAccountId, newEmail) {
    try {
      const pool = await getMasterConnection();
      await pool.request()
        .input('UserAccountID', sql.UniqueIdentifier, userAccountId)
        .input('Email', sql.NVarChar(255), newEmail)
        .input('Username', sql.NVarChar(255), newEmail)
        .query(`
          UPDATE dbo.sec_UserAccounts
          SET Email = @Email,
              Username = @Username,
              ModifiedOn = SYSUTCDATETIME()
          WHERE UserAccountID = @UserAccountID
        `);
    } catch (error) {
      if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
        throw new Error('Email address is already in use');
      }
      throw new Error(`Error updating email: ${error.message}`);
    }
  }

  /**
   * Link an existing UserAccount to a stakeholder
   * @param {string} userAccountId - User account GUID
   * @param {string} stakeholderId - Stakeholder GUID
   * @returns {Promise<void>}
   */
  static async linkToStakeholder(userAccountId, stakeholderId) {
    try {
      const pool = await getMasterConnection();
      await pool.request()
        .input('UserAccountID', sql.UniqueIdentifier, userAccountId)
        .input('StakeholderID', sql.UniqueIdentifier, stakeholderId)
        .query(`
          UPDATE dbo.sec_UserAccounts
          SET StakeholderID = @StakeholderID,
              ModifiedOn = SYSUTCDATETIME()
          WHERE UserAccountID = @UserAccountID
        `);
    } catch (error) {
      throw new Error(`Error linking user account to stakeholder: ${error.message}`);
    }
  }

  /**
   * Reactivate a soft-deleted user account
   * @param {string} userAccountId - User account GUID
   * @returns {Promise<void>}
   */
  static async reactivate(userAccountId) {
    try {
      const pool = await getMasterConnection();
      await pool.request()
        .input('UserAccountID', sql.UniqueIdentifier, userAccountId)
        .query(`
          UPDATE dbo.sec_UserAccounts
          SET IsActive = 1,
              ModifiedOn = SYSUTCDATETIME()
          WHERE UserAccountID = @UserAccountID
        `);
    } catch (error) {
      throw new Error(`Error reactivating user account: ${error.message}`);
    }
  }

  /**
   * Deactivate (soft delete) a user account
   * @param {string} userAccountId - User account GUID
   * @returns {Promise<void>}
   */
  static async deactivate(userAccountId) {
    try {
      const pool = await getMasterConnection();
      await pool.request()
        .input('UserAccountID', sql.UniqueIdentifier, userAccountId)
        .query(`
          UPDATE dbo.sec_UserAccounts
          SET IsActive = 0,
              ModifiedOn = SYSUTCDATETIME()
          WHERE UserAccountID = @UserAccountID
        `);
    } catch (error) {
      throw new Error(`Error deactivating user account: ${error.message}`);
    }
  }

  /**
   * Update password for a user account
   * @param {string} userAccountId - User account GUID
   * @param {string} newPassword - New password (plain text)
   * @returns {Promise<void>}
   */
  static async updatePassword(userAccountId, newPassword) {
    try {
      const pool = await getMasterConnection();
      const passwordHash = await bcrypt.hash(newPassword, config.auth.bcryptRounds);
      
      await pool.request()
        .input('UserAccountID', sql.UniqueIdentifier, userAccountId)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .query(`
          UPDATE dbo.sec_UserAccounts
          SET PasswordHash = @PasswordHash,
              MustChangePassword = 0,
              TempPasswordExpiry = NULL,
              PasswordLastChanged = SYSUTCDATETIME()
          WHERE UserAccountID = @UserAccountID
        `);
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }
}

module.exports = UserAccount;

