const File = require('../models/file');
const storageService = require('../services/storageService');
const { logger } = require('../utils/logger');
const crypto = require('crypto');
const path = require('path');

const isGuid = (value = '') => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);

/**
 * Get all files for a folder
 */
const getFilesByFolder = async (req, res) => {
  const { folderId, communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  // Handle "root" as a special value for root-level files
  let normalizedFolderId = folderId;
  if (folderId === 'root') {
    normalizedFolderId = null;
  } else if (folderId && !isGuid(folderId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required (use "root" for root-level files)'
    });
  }

  try {
    const files = await File.getByFolder(normalizedFolderId, communityId);

    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: files,
      count: files.length
    });
  } catch (error) {
    logger.error('Error fetching files by folder', 'FileController', { folderId, communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files',
      error: error.message
    });
  }
};

/**
 * Get all files for a community
 */
const getFilesByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const files = await File.getByCommunity(communityId);

    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: files,
      count: files.length
    });
  } catch (error) {
    logger.error('Error fetching files by community', 'FileController', { communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files',
      error: error.message
    });
  }
};

/**
 * Get all corporate files for a folder
 */
const getCorporateFilesByFolder = async (req, res) => {
  const { folderId } = req.params;

  // Handle "root" as a special value for root-level files
  let normalizedFolderId = folderId;
  if (folderId === 'root') {
    normalizedFolderId = null;
  } else if (folderId && !isGuid(folderId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required (use "root" for root-level files)'
    });
  }

  try {
    const files = await File.getCorporateByFolder(normalizedFolderId);

    res.status(200).json({
      success: true,
      message: 'Corporate files retrieved successfully',
      data: files,
      count: files.length
    });
  } catch (error) {
    logger.error('Error fetching corporate files by folder', 'FileController', { folderId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve corporate files',
      error: error.message
    });
  }
};

/**
 * Get file by ID
 */
const getFileById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid file ID is required'
    });
  }

  try {
    const file = await File.getById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File retrieved successfully',
      data: file
    });
  } catch (error) {
    logger.error('Error fetching file by ID', 'FileController', { id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file',
      error: error.message
    });
  }
};

/**
 * Update a file (metadata only - rename, move folder, etc.)
 */
const updateFile = async (req, res) => {
  const { id } = req.params;
  const { FileName, FolderID, FileType } = req.body;
  const userId = req.user?.id || null;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid file ID is required'
    });
  }

  if (FolderID && !isGuid(FolderID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required'
    });
  }

  try {
    const fileData = {
      FileName: FileName ? FileName.trim() : undefined,
      FolderID: FolderID !== undefined ? (FolderID || null) : undefined,
      FileType: FileType || undefined,
      ModifiedBy: userId
    };

    const file = await File.update(id, fileData);

    res.status(200).json({
      success: true,
      message: 'File updated successfully',
      data: file
    });
  } catch (error) {
    logger.error('Error updating file', 'FileController', { id, body: req.body }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file',
      error: error.message
    });
  }
};

/**
 * Delete a file
 */
const deleteFile = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid file ID is required'
    });
  }

  try {
    // Get file info before deleting
    const file = await File.getById(id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Soft delete in database
    await File.delete(id);

    // Delete from blob storage
    try {
      const blobName = storageService.getBlobNameFromUrl(file.FilePath);
      await storageService.deleteFile(blobName);
    } catch (blobError) {
      logger.error('Error deleting file from blob storage', 'FileController', { fileId: id }, blobError);
      // Continue even if blob delete fails - database record is already deleted
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file', 'FileController', { id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

/**
 * Upload a file
 */
const uploadFile = async (req, res) => {
  const { CommunityID, FolderID, FileType, FolderType } = req.body;
  const userId = req.user?.id || null;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Determine FolderType - default based on CommunityID presence
  const determinedFolderType = FolderType || (CommunityID ? 'Community' : 'Corporate');

  // Validate based on FolderType
  if (determinedFolderType === 'Community' && !isGuid(CommunityID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required for Community files'
    });
  }

  if (determinedFolderType === 'Corporate' && CommunityID) {
    return res.status(400).json({
      success: false,
      message: 'Corporate files must not have a CommunityID'
    });
  }

  // Handle empty string from FormData as null
  const folderId = FolderID && FolderID.trim() !== '' ? FolderID : null;

  if (folderId && !isGuid(folderId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid folder ID is required'
    });
  }

  try {
    // Determine file type from mime type if not provided
    let detectedFileType = FileType;
    if (!detectedFileType) {
      if (file.mimetype.startsWith('image/')) {
        detectedFileType = 'image';
      } else if (file.mimetype === 'application/pdf') {
        detectedFileType = 'document';
      } else if (file.mimetype.includes('word') || file.mimetype.includes('excel') || file.mimetype.includes('powerpoint')) {
        detectedFileType = 'document';
      } else {
        detectedFileType = 'document';
      }
    }

    // Generate unique filename for blob storage
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
    
    // Build blob path based on FolderType
    let blobName;
    if (determinedFolderType === 'Corporate') {
      // Corporate files: corporate/files/{folderId}/{filename} or corporate/files/{filename}
      blobName = 'corporate/files';
      if (folderId) {
        blobName += `/${folderId}`;
      }
      blobName += `/${uniqueFileName}`;
    } else {
      // Community files: communities/{communityId}/files/{folderId}/{filename} or communities/{communityId}/files/{filename}
      blobName = `communities/${CommunityID}/files`;
      if (folderId) {
        blobName += `/${folderId}`;
      }
      blobName += `/${uniqueFileName}`;
    }

    // Upload to blob storage
    const blobUrl = await storageService.uploadFile(
      file.buffer, // File content from memory
      blobName,
      file.mimetype
    );

    const fileData = {
      FolderID: folderId,
      CommunityID: determinedFolderType === 'Corporate' ? null : CommunityID,
      FolderType: determinedFolderType,
      FileName: file.originalname,
      FileNameStored: uniqueFileName,
      FilePath: blobUrl, // Blob URL instead of local path
      FileSize: file.size,
      MimeType: file.mimetype,
      FileType: detectedFileType,
      CreatedBy: userId
    };

    const savedFile = await File.create(fileData);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: savedFile
    });
  } catch (error) {
    logger.error('Error uploading file', 'FileController', { file: file?.originalname }, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * Download a file
 */
const downloadFile = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid file ID is required'
    });
  }

  try {
    const file = await File.getById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    logger.info('Downloading file', 'FileController', {
      fileId: id,
      fileName: file.FileName,
      filePath: file.FilePath,
      folderType: file.FolderType,
      communityId: file.CommunityID
    });

    // Extract blob name from URL
    let blobName;
    try {
      blobName = storageService.getBlobNameFromUrl(file.FilePath);
      logger.info('Extracted blob name from URL', 'FileController', {
        fileId: id,
        blobName,
        originalUrl: file.FilePath
      });
    } catch (urlError) {
      logger.error('Error extracting blob name from URL', 'FileController', {
        fileId: id,
        filePath: file.FilePath,
        error: urlError.message
      }, urlError);
      throw urlError;
    }

    // Download from blob storage
    logger.info('Attempting to download from blob storage', 'FileController', {
      fileId: id,
      blobName
    });
    
    const fileBuffer = await storageService.downloadFile(blobName);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.FileName}"`);
    res.setHeader('Content-Type', file.MimeType || 'application/octet-stream');
    res.setHeader('Content-Length', file.FileSize);

    // Send the file buffer
    res.send(fileBuffer);
  } catch (error) {
    logger.error('Error downloading file', 'FileController', { id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
};

module.exports = {
  getFilesByFolder,
  getFilesByCommunity,
  getCorporateFilesByFolder,
  getFileById,
  uploadFile,
  downloadFile,
  updateFile,
  deleteFile
};

