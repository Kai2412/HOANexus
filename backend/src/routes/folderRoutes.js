const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get folder tree (hierarchical) for a community
router.get('/community/:communityId/tree', folderController.getFolderTreeByCommunity);

// Get all folders (flat list) for a community
router.get('/community/:communityId', folderController.getFoldersByCommunity);

// Get corporate folder tree (hierarchical)
router.get('/corporate/tree', folderController.getCorporateFolderTree);

// Get all corporate folders (flat list)
router.get('/corporate', folderController.getCorporateFolders);

// Get Corporate folders that contain files linked to a community (virtual folder)
router.get('/corporate/community/:communityId', folderController.getCorporateFoldersForCommunity);

// Get folder by ID
router.get('/:id', folderController.getFolderById);

// Create folder
router.post('/', folderController.createFolder);

// Update folder
router.put('/:id', folderController.updateFolder);

// Delete folder
router.delete('/:id', folderController.deleteFolder);

module.exports = router;

