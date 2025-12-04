const Folder = require('../models/folder');
const { logger } = require('../utils/logger');

const isGuid = (value = '') => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);

/**
 * Get all folders for a community
 */
const getFoldersByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const folders = await Folder.getByCommunity(communityId);

    res.status(200).json({
      success: true,
      message: 'Folders retrieved successfully',
      data: folders,
      count: folders.length
    });
  } catch (error) {
    logger.error('Error fetching folders by community', 'FolderController', { communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve folders',
      error: error.message
    });
  }
};

/**
 * Get folder tree (hierarchical structure) for a community
 */
const getFolderTreeByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const folderTree = await Folder.getTreeByCommunity(communityId);

    res.status(200).json({
      success: true,
      message: 'Folder tree retrieved successfully',
      data: folderTree
    });
  } catch (error) {
    logger.error('Error fetching folder tree', 'FolderController', { communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve folder tree',
      error: error.message
    });
  }
};

/**
 * Get folder by ID
 */
const getFolderById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required'
    });
  }

  try {
    const folder = await Folder.getById(id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Folder retrieved successfully',
      data: folder
    });
  } catch (error) {
    logger.error('Error fetching folder by ID', 'FolderController', { id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve folder',
      error: error.message
    });
  }
};

/**
 * Get corporate folder tree (hierarchical structure)
 */
const getCorporateFolderTree = async (req, res) => {
  try {
    const folderTree = await Folder.getCorporateTree();

    res.status(200).json({
      success: true,
      message: 'Corporate folder tree retrieved successfully',
      data: folderTree
    });
  } catch (error) {
    logger.error('Error fetching corporate folder tree', 'FolderController', {}, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve corporate folder tree',
      error: error.message
    });
  }
};

/**
 * Get all corporate folders (flat list)
 */
const getCorporateFolders = async (req, res) => {
  try {
    const folders = await Folder.getCorporate();

    res.status(200).json({
      success: true,
      message: 'Corporate folders retrieved successfully',
      data: folders,
      count: folders.length
    });
  } catch (error) {
    logger.error('Error fetching corporate folders', 'FolderController', {}, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve corporate folders',
      error: error.message
    });
  }
};

/**
 * Create a new folder
 */
const createFolder = async (req, res) => {
  const { CommunityID, ParentFolderID, FolderName, DisplayOrder, FolderType } = req.body;
  const userId = req.user?.id || null;

  // CommunityID can be null (Corporate/Global folder) or a valid GUID (community-specific)
  if (CommunityID !== null && CommunityID !== undefined && !isGuid(CommunityID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required (or null for Corporate/Global folders)'
    });
  }

  if (!FolderName || FolderName.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Folder name is required'
    });
  }

  if (ParentFolderID && !isGuid(ParentFolderID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid parent folder ID is required'
    });
  }

  try {
    const folderData = {
      CommunityID: CommunityID || null,
      ParentFolderID: ParentFolderID || null,
      FolderName: FolderName.trim(),
      FolderType: FolderType || (CommunityID ? 'Community' : 'Corporate'),
      DisplayOrder: DisplayOrder || 0,
      CreatedBy: userId
    };

    const folder = await Folder.create(folderData);

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder
    });
  } catch (error) {
    logger.error('Error creating folder', 'FolderController', req.body, error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: error.message
    });
  }
};

/**
 * Update a folder
 */
const updateFolder = async (req, res) => {
  const { id } = req.params;
  const { FolderName, ParentFolderID, DisplayOrder } = req.body;
  const userId = req.user?.id || null;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required'
    });
  }

  if (ParentFolderID && !isGuid(ParentFolderID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid parent folder ID is required'
    });
  }

  try {
    const folderData = {
      FolderName: FolderName ? FolderName.trim() : undefined,
      ParentFolderID: ParentFolderID !== undefined ? (ParentFolderID || null) : undefined,
      DisplayOrder: DisplayOrder !== undefined ? DisplayOrder : undefined,
      ModifiedBy: userId
    };

    const folder = await Folder.update(id, folderData);

    res.status(200).json({
      success: true,
      message: 'Folder updated successfully',
      data: folder
    });
  } catch (error) {
    logger.error('Error updating folder', 'FolderController', { id, body: req.body }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update folder',
      error: error.message
    });
  }
};

/**
 * Delete a folder
 */
const deleteFolder = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required'
    });
  }

  try {
    await Folder.delete(id);

    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting folder', 'FolderController', { id }, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete folder',
      error: error.message
    });
  }
};

module.exports = {
  getFoldersByCommunity,
  getFolderTreeByCommunity,
  getCorporateFolders,
  getCorporateFolderTree,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder
};

