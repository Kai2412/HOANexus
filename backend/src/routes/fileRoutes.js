const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);

// Upload file
router.post('/upload', upload.single('file'), handleUploadError, fileController.uploadFile);

// Download file
router.get('/:id/download', fileController.downloadFile);

// Get all files for a community
router.get('/community/:communityId', fileController.getFilesByCommunity);

// Get files by folder (folderId can be 'root' for root files, 'corporate' for Corporate files)
router.get('/folder/:folderId/community/:communityId', fileController.getFilesByFolder);

// Get Corporate files by folder for a specific community (virtual Corporate folder)
router.get('/corporate/folder/:corporateFolderId/community/:communityId', fileController.getCorporateFilesByFolderForCommunity);

// Get corporate files by folder (folderId can be 'root' for root files)
router.get('/corporate/folder/:folderId', fileController.getCorporateFilesByFolder);

// Get file by ID
router.get('/:id', fileController.getFileById);

// Update file (metadata only)
router.put('/:id', fileController.updateFile);

// Delete file
router.delete('/:id', fileController.deleteFile);

module.exports = router;

