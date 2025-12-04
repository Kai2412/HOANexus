const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const File = {
  /**
   * Get all files for a folder (Community files)
   * @param {string} folderId - Folder ID (null for root files)
   * @param {string} communityId - Community ID
   * @returns {Promise<Array>} Array of files
   */
  getByFolder: async (folderId, communityId) => {
    const pool = await getConnection();
    try {
      const request = pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId);
      
      let query = `
        SELECT 
          FileID,
          FolderID,
          CommunityID,
          FileName,
          FileNameStored,
          FilePath,
          FileSize,
          FolderType,
          MimeType,
          FileType,
          IsActive,
          CreatedOn,
          CreatedBy,
          ModifiedOn,
          ModifiedBy
        FROM cor_Files
        WHERE FolderType = 'Community'
          AND CommunityID = @CommunityID
          AND IsActive = 1
      `;
      
      if (folderId) {
        request.input('FolderID', sql.UniqueIdentifier, folderId);
        query += ' AND FolderID = @FolderID';
      } else {
        query += ' AND FolderID IS NULL';
      }
      
      query += ' ORDER BY CreatedOn DESC';
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Error fetching files by folder', 'File', { folderId, communityId }, error);
      throw error;
    }
  },

  /**
   * Get all corporate files for a folder
   * @param {string} folderId - Folder ID (null for root files)
   * @returns {Promise<Array>} Array of corporate files
   */
  getCorporateByFolder: async (folderId) => {
    const pool = await getConnection();
    try {
      const request = pool.request();
      
      let query = `
        SELECT 
          FileID,
          FolderID,
          CommunityID,
          FileName,
          FileNameStored,
          FilePath,
          FileSize,
          FolderType,
          MimeType,
          FileType,
          IsActive,
          CreatedOn,
          CreatedBy,
          ModifiedOn,
          ModifiedBy
        FROM cor_Files
        WHERE FolderType = 'Corporate'
          AND IsActive = 1
      `;
      
      if (folderId) {
        request.input('FolderID', sql.UniqueIdentifier, folderId);
        query += ' AND FolderID = @FolderID';
      } else {
        query += ' AND FolderID IS NULL';
      }
      
      query += ' ORDER BY CreatedOn DESC';
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Error fetching corporate files by folder', 'File', { folderId }, error);
      throw error;
    }
  },

  /**
   * Get all files for a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Array>} Array of files
   */
  getByCommunity: async (communityId) => {
    const pool = await getConnection();
    try {
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            FileID,
            FolderID,
            CommunityID,
            FileName,
            FileNameStored,
            FilePath,
            FileSize,
            FolderType,
            MimeType,
            FileType,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Files
          WHERE FolderType = 'Community'
            AND CommunityID = @CommunityID
            AND IsActive = 1
          ORDER BY CreatedOn DESC
        `);
      
      return result.recordset;
    } catch (error) {
      logger.error('Error fetching files by community', 'File', { communityId }, error);
      throw error;
    }
  },

  /**
   * Get file by ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object|null>} File object or null
   */
  getById: async (fileId) => {
    const pool = await getConnection();
    try {
      const result = await pool.request()
        .input('FileID', sql.UniqueIdentifier, fileId)
        .query(`
          SELECT 
            FileID,
            FolderID,
            CommunityID,
            FileName,
            FileNameStored,
            FilePath,
            FileSize,
            FolderType,
            MimeType,
            FileType,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Files
          WHERE FileID = @FileID
            AND IsActive = 1
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      logger.error('Error fetching file by ID', 'File', { fileId }, error);
      throw error;
    }
  },

  /**
   * Create a new file record
   * @param {Object} fileData - File data
   * @returns {Promise<Object>} Created file
   */
  create: async (fileData) => {
    const pool = await getConnection();
    try {
      // Determine FolderType based on CommunityID and provided FolderType
      // Default: Community if CommunityID provided, Corporate if not
      const folderType = fileData.FolderType || (fileData.CommunityID ? 'Community' : 'Corporate');
      
      // Validate FolderType matches CommunityID
      if (folderType === 'Community' && !fileData.CommunityID) {
        throw new Error('Community files must have a CommunityID');
      }
      if (folderType === 'Corporate' && fileData.CommunityID) {
        throw new Error('Corporate files must have CommunityID as NULL');
      }
      
      // Handle NULL CommunityID for Corporate files
      const communityIdParam = fileData.CommunityID 
        ? sql.UniqueIdentifier 
        : sql.NVarChar(50);
      const communityIdValue = fileData.CommunityID || null;
      
      const result = await pool.request()
        .input('FolderID', fileData.FolderID ? sql.UniqueIdentifier : sql.NVarChar(50), fileData.FolderID || null)
        .input('CommunityID', communityIdParam, communityIdValue)
        .input('FileName', sql.NVarChar(255), fileData.FileName)
        .input('FileNameStored', sql.NVarChar(255), fileData.FileNameStored)
        .input('FilePath', sql.NVarChar(1000), fileData.FilePath)
        .input('FileSize', sql.BigInt, fileData.FileSize)
        .input('FolderType', sql.NVarChar(50), folderType)
        .input('MimeType', sql.NVarChar(100), fileData.MimeType || null)
        .input('FileType', sql.NVarChar(50), fileData.FileType || null)
        .input('CreatedBy', fileData.CreatedBy ? sql.UniqueIdentifier : sql.NVarChar(50), fileData.CreatedBy || null)
        .query(`
          INSERT INTO cor_Files (
            FolderID,
            CommunityID,
            FileName,
            FileNameStored,
            FilePath,
            FileSize,
            FolderType,
            MimeType,
            FileType,
            CreatedBy
          )
          OUTPUT INSERTED.FileID
          VALUES (
            @FolderID,
            @CommunityID,
            @FileName,
            @FileNameStored,
            @FilePath,
            @FileSize,
            @FolderType,
            @MimeType,
            @FileType,
            @CreatedBy
          );
        `);
      
      const fileId = result.recordset[0].FileID;
      return await File.getById(fileId);
    } catch (error) {
      logger.error('Error creating file', 'File', fileData, error);
      throw error;
    }
  },

  /**
   * Update a file record
   * @param {string} fileId - File ID
   * @param {Object} fileData - Updated file data
   * @returns {Promise<Object>} Updated file
   */
  update: async (fileId, fileData) => {
    const pool = await getConnection();
    try {
      await pool.request()
        .input('FileID', sql.UniqueIdentifier, fileId)
        .input('FileName', sql.NVarChar(255), fileData.FileName)
        .input('FolderID', fileData.FolderID ? sql.UniqueIdentifier : sql.NVarChar(50), fileData.FolderID || null)
        .input('FileType', sql.NVarChar(50), fileData.FileType)
        .input('ModifiedBy', fileData.ModifiedBy ? sql.UniqueIdentifier : sql.NVarChar(50), fileData.ModifiedBy || null)
        .query(`
          UPDATE cor_Files
          SET 
            FileName = COALESCE(@FileName, FileName),
            FolderID = COALESCE(@FolderID, FolderID),
            FileType = COALESCE(@FileType, FileType),
            ModifiedOn = SYSUTCDATETIME(),
            ModifiedBy = @ModifiedBy
          WHERE FileID = @FileID
        `);
      
      return await File.getById(fileId);
    } catch (error) {
      logger.error('Error updating file', 'File', { fileId, fileData }, error);
      throw error;
    }
  },

  /**
   * Hard delete a file (permanently remove from database)
   * @param {string} fileId - File ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async (fileId) => {
    const pool = await getConnection();
    try {
      await pool.request()
        .input('FileID', sql.UniqueIdentifier, fileId)
        .query(`
          DELETE FROM cor_Files
          WHERE FileID = @FileID
        `);
      
      return true;
    } catch (error) {
      logger.error('Error deleting file', 'File', { fileId }, error);
      throw error;
    }
  }
};

module.exports = File;

