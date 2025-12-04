const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const Folder = {
  /**
   * Get all folders for a community (Community and Global folders)
   * @param {string} communityId - Community ID
   * @returns {Promise<Array>} Array of folders
   */
  getByCommunity: async (communityId) => {
    const pool = await getConnection();
    try {
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            FolderID,
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType,
            DisplayOrder,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Folders
          WHERE FolderType IN ('Community', 'Global')
            AND (CommunityID IS NULL OR CommunityID = @CommunityID)
            AND IsActive = 1
          ORDER BY DisplayOrder, FolderName
        `);
      
      return result.recordset;
    } catch (error) {
      logger.error('Error fetching folders by community', 'Folder', { communityId }, error);
      throw error;
    }
  },

  /**
   * Get all corporate folders
   * @returns {Promise<Array>} Array of corporate folders
   */
  getCorporate: async () => {
    const pool = await getConnection();
    try {
      const result = await pool.request()
        .query(`
          SELECT 
            FolderID,
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType,
            DisplayOrder,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Folders
          WHERE FolderType = 'Corporate'
            AND IsActive = 1
          ORDER BY DisplayOrder, FolderName
        `);
      
      return result.recordset;
    } catch (error) {
      logger.error('Error fetching corporate folders', 'Folder', {}, error);
      throw error;
    }
  },

  /**
   * Get folder by ID
   * @param {string} folderId - Folder ID
   * @returns {Promise<Object|null>} Folder object or null
   */
  getById: async (folderId) => {
    const pool = await getConnection();
    try {
      const result = await pool.request()
        .input('FolderID', sql.UniqueIdentifier, folderId)
        .query(`
          SELECT 
            FolderID,
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType,
            DisplayOrder,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Folders
          WHERE FolderID = @FolderID
            AND IsActive = 1
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      logger.error('Error fetching folder by ID', 'Folder', { folderId }, error);
      throw error;
    }
  },

  /**
   * Get folder tree (hierarchical structure)
   * @param {string} communityId - Community ID
   * @returns {Promise<Array>} Array of folders with children
   */
  getTreeByCommunity: async (communityId) => {
    const pool = await getConnection();
    try {
      // Get all folders (Global + Community-specific)
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            FolderID,
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType,
            DisplayOrder,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Folders
          WHERE FolderType IN ('Community', 'Global')
            AND (CommunityID IS NULL OR CommunityID = @CommunityID)
            AND IsActive = 1
          ORDER BY DisplayOrder, FolderName
        `);
      
      const folders = result.recordset;
      
      // Build tree structure
      const folderMap = new Map();
      const rootFolders = [];
      
      // First pass: create map
      folders.forEach(folder => {
        folderMap.set(folder.FolderID, { ...folder, children: [] });
      });
      
      // Second pass: build tree
      folders.forEach(folder => {
        const folderNode = folderMap.get(folder.FolderID);
        if (folder.ParentFolderID) {
          const parent = folderMap.get(folder.ParentFolderID);
          if (parent) {
            parent.children.push(folderNode);
          } else {
            // Parent not found, treat as root
            rootFolders.push(folderNode);
          }
        } else {
          rootFolders.push(folderNode);
        }
      });
      
      return rootFolders;
    } catch (error) {
      logger.error('Error fetching folder tree', 'Folder', { communityId }, error);
      throw error;
    }
  },

  /**
   * Get corporate folder tree (hierarchical structure)
   * @returns {Promise<Array>} Array of corporate folders with children
   */
  getCorporateTree: async () => {
    const pool = await getConnection();
    try {
      // Get all corporate folders
      const result = await pool.request()
        .query(`
          SELECT 
            FolderID,
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType,
            DisplayOrder,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Folders
          WHERE FolderType = 'Corporate'
            AND IsActive = 1
          ORDER BY DisplayOrder, FolderName
        `);
      
      const folders = result.recordset;
      
      // Build tree structure
      const folderMap = new Map();
      const rootFolders = [];
      
      // First pass: create map
      folders.forEach(folder => {
        folderMap.set(folder.FolderID, { ...folder, children: [] });
      });
      
      // Second pass: build tree
      folders.forEach(folder => {
        const folderNode = folderMap.get(folder.FolderID);
        if (folder.ParentFolderID) {
          const parent = folderMap.get(folder.ParentFolderID);
          if (parent) {
            parent.children.push(folderNode);
          } else {
            // Parent not found, treat as root
            rootFolders.push(folderNode);
          }
        } else {
          rootFolders.push(folderNode);
        }
      });
      
      return rootFolders;
    } catch (error) {
      logger.error('Error fetching corporate folder tree', 'Folder', {}, error);
      throw error;
    }
  },

  /**
   * Create a new folder
   * @param {Object} folderData - Folder data
   * @returns {Promise<Object>} Created folder
   */
  create: async (folderData) => {
    const pool = await getConnection();
    
    try {
      // Build folder path
      let folderPath = `/${folderData.FolderName}`;
      if (folderData.ParentFolderID) {
        const parent = await pool.request()
          .input('FolderID', sql.UniqueIdentifier, folderData.ParentFolderID)
          .query('SELECT FolderPath FROM cor_Folders WHERE FolderID = @FolderID');
        
        if (parent.recordset[0]) {
          folderPath = `${parent.recordset[0].FolderPath}${folderPath}`;
        }
      }
      
      // Determine FolderType based on CommunityID and provided FolderType
      // Default: Community if CommunityID provided, Corporate if not
      const folderType = folderData.FolderType || (folderData.CommunityID ? 'Community' : 'Corporate');
      
      // Validate FolderType matches CommunityID
      if (folderType === 'Community' && !folderData.CommunityID) {
        throw new Error('Community folders must have a CommunityID');
      }
      if ((folderType === 'Corporate' || folderType === 'Global') && folderData.CommunityID) {
        throw new Error('Corporate and Global folders must have CommunityID as NULL');
      }
      
      // Handle NULL CommunityID for Corporate/Global folders
      const communityIdParam = folderData.CommunityID 
        ? sql.UniqueIdentifier 
        : sql.NVarChar(50);
      const communityIdValue = folderData.CommunityID || null;
      
      const result = await pool.request()
        .input('CommunityID', communityIdParam, communityIdValue)
        .input('ParentFolderID', folderData.ParentFolderID ? sql.UniqueIdentifier : sql.NVarChar(50), folderData.ParentFolderID || null)
        .input('FolderName', sql.NVarChar(255), folderData.FolderName)
        .input('FolderPath', sql.NVarChar(1000), folderPath)
        .input('FolderType', sql.NVarChar(50), folderType)
        .input('DisplayOrder', sql.Int, folderData.DisplayOrder || 0)
        .input('CreatedBy', folderData.CreatedBy ? sql.UniqueIdentifier : sql.NVarChar(50), folderData.CreatedBy || null)
        .query(`
          INSERT INTO cor_Folders (
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType,
            DisplayOrder,
            CreatedBy
          )
          OUTPUT INSERTED.FolderID
          VALUES (
            @CommunityID,
            @ParentFolderID,
            @FolderName,
            @FolderPath,
            @FolderType,
            @DisplayOrder,
            @CreatedBy
          );
        `);
      
      // Get the created folder
      const folderId = result.recordset[0].FolderID;
      return await Folder.getById(folderId);
    } catch (error) {
      logger.error('Error creating folder', 'Folder', folderData, error);
      throw error;
    }
  },

  /**
   * Update a folder
   * @param {string} folderId - Folder ID
   * @param {Object} folderData - Updated folder data
   * @returns {Promise<Object>} Updated folder
   */
  update: async (folderId, folderData) => {
    const pool = await getConnection();
    try {
      // Rebuild path if name or parent changed
      let folderPath = folderData.FolderPath;
      if (folderData.FolderName || folderData.ParentFolderID !== undefined) {
        const currentFolder = await Folder.getById(folderId);
        const newName = folderData.FolderName || currentFolder.FolderName;
        const newParentId = folderData.ParentFolderID !== undefined ? folderData.ParentFolderID : currentFolder.ParentFolderID;
        
        folderPath = `/${newName}`;
        if (newParentId) {
          const parent = await pool.request()
            .input('FolderID', sql.UniqueIdentifier, newParentId)
            .query('SELECT FolderPath FROM cor_Folders WHERE FolderID = @FolderID');
          
          if (parent.recordset[0]) {
            folderPath = `${parent.recordset[0].FolderPath}${folderPath}`;
          }
        }
      }
      
      await pool.request()
        .input('FolderID', sql.UniqueIdentifier, folderId)
        .input('FolderName', sql.NVarChar(255), folderData.FolderName)
        .input('ParentFolderID', folderData.ParentFolderID ? sql.UniqueIdentifier : sql.NVarChar(50), folderData.ParentFolderID || null)
        .input('FolderPath', sql.NVarChar(1000), folderPath)
        .input('DisplayOrder', sql.Int, folderData.DisplayOrder)
        .input('ModifiedBy', folderData.ModifiedBy ? sql.UniqueIdentifier : sql.NVarChar(50), folderData.ModifiedBy || null)
        .query(`
          UPDATE cor_Folders
          SET 
            FolderName = COALESCE(@FolderName, FolderName),
            ParentFolderID = COALESCE(@ParentFolderID, ParentFolderID),
            FolderPath = COALESCE(@FolderPath, FolderPath),
            DisplayOrder = COALESCE(@DisplayOrder, DisplayOrder),
            ModifiedOn = SYSUTCDATETIME(),
            ModifiedBy = @ModifiedBy
          WHERE FolderID = @FolderID
        `);
      
      return await Folder.getById(folderId);
    } catch (error) {
      logger.error('Error updating folder', 'Folder', { folderId, folderData }, error);
      throw error;
    }
  },

  /**
   * Delete (soft delete) a folder
   * @param {string} folderId - Folder ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async (folderId) => {
    const pool = await getConnection();
    try {
      // Check if folder has files or subfolders
      const filesCheck = await pool.request()
        .input('FolderID', sql.UniqueIdentifier, folderId)
        .query('SELECT COUNT(*) AS FileCount FROM cor_Files WHERE FolderID = @FolderID AND IsActive = 1');
      
      const subfoldersCheck = await pool.request()
        .input('ParentFolderID', sql.UniqueIdentifier, folderId)
        .query('SELECT COUNT(*) AS FolderCount FROM cor_Folders WHERE ParentFolderID = @ParentFolderID AND IsActive = 1');
      
      if (filesCheck.recordset[0].FileCount > 0 || subfoldersCheck.recordset[0].FolderCount > 0) {
        throw new Error('Cannot delete folder: folder contains files or subfolders');
      }
      
      await pool.request()
        .input('FolderID', sql.UniqueIdentifier, folderId)
        .query(`
          UPDATE cor_Folders
          SET IsActive = 0,
              ModifiedOn = SYSUTCDATETIME()
          WHERE FolderID = @FolderID
        `);
      
      return true;
    } catch (error) {
      logger.error('Error deleting folder', 'Folder', { folderId }, error);
      throw error;
    }
  }
};

module.exports = Folder;

