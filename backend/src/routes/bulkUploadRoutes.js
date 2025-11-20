const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const {
  generateCommunitiesTemplate,
  validateCommunitiesCSV,
  processCommunitiesImport
} = require('../controllers/bulkUploadController');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV files
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// GET /api/admin/bulk-upload/communities/template - Download template
router.get('/communities/template', authenticateToken, generateCommunitiesTemplate);

// POST /api/admin/bulk-upload/communities/validate - Validate uploaded CSV
router.post('/communities/validate', authenticateToken, upload.single('file'), validateCommunitiesCSV);

// POST /api/admin/bulk-upload/communities/import - Process import
router.post('/communities/import', authenticateToken, processCommunitiesImport);

module.exports = router;

