const express = require('express');
const router = express.Router();
const aiService = require('../services/ai/aiService');
const embeddingService = require('../services/ai/embeddingService');
const documentIndexingService = require('../services/ai/documentIndexingService');
const vectorDatabaseService = require('../services/ai/vectorDatabaseService');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

/**
 * AI Routes - Isolated routes for AI functionality
 * All routes are protected and have error isolation
 */

// All routes require authentication
router.use(authenticateToken);

// Middleware to check if AI service is enabled
const checkAIService = (req, res, next) => {
  if (!aiService.isServiceEnabled()) {
    return res.status(503).json({
      success: false,
      error: 'AI Service is not available. Please configure ANTHROPIC_API_KEY in environment variables.'
    });
  }
  next();
};

// Middleware to check if embedding service is enabled (for indexing)
const checkEmbeddingService = (req, res, next) => {
  if (!embeddingService.isServiceEnabled()) {
    return res.status(503).json({
      success: false,
      error: 'Embedding Service is not available. Please configure OPENAI_API_KEY in environment variables.'
    });
  }
  next();
};

/**
 * POST /api/ai/chat
 * Basic chat endpoint
 */
router.post('/chat', checkAIService, async (req, res) => {
  try {
    const { message, conversationHistory = [], communityId, folderType, useRAG } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Limit message length
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 2000 characters.'
      });
    }

    // Call AI service with RAG options
    const result = await aiService.chat(message, conversationHistory, {
      communityId,
      folderType,
      useRAG: useRAG !== false // Default to true
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in AI chat endpoint', 'AIRoutes', { 
      message: req.body.message,
      errorMessage: error.message,
      errorStack: error.stack
    }, error);
    
    // Return error without crashing - include more details in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message. Please try again.',
      ...(isDevelopment && {
        details: error.message,
        stack: error.stack
      })
    });
  }
});

/**
 * GET /api/ai/test
 * Test endpoint to verify AI service is working
 */
router.get('/test', checkAIService, async (req, res) => {
  try {
    const result = await aiService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'AI Service is working',
        testResponse: result.response
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in AI test endpoint', 'AIRoutes', {}, error);
    res.status(500).json({
      success: false,
      error: 'AI Service test failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ai/status
 * Check AI service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    enabled: aiService.isServiceEnabled(),
    message: aiService.isServiceEnabled() 
      ? 'AI Service is enabled and ready' 
      : 'AI Service is disabled. Configure ANTHROPIC_API_KEY to enable.'
  });
});

/**
 * POST /api/ai/index-documents
 * Index all PDF documents in the database
 */
router.post('/index-documents', checkEmbeddingService, async (req, res) => {
  try {
    const { communityId, folderType } = req.body;

    logger.info('Document indexing requested', 'AIRoutes', {
      communityId,
      folderType
    });

    const result = await documentIndexingService.indexAllFiles({
      communityId,
      folderType
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error indexing documents', 'AIRoutes', {
      errorMessage: error.message
    }, error);
    res.status(500).json({
      success: false,
      error: 'Failed to index documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/index-file/:fileId
 * Index a specific file
 */
router.post('/index-file/:fileId', checkEmbeddingService, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { sql, getConnection } = require('../config/database');
    const File = require('../models/file');
    const Folder = require('../models/folder');

    // Get file record
    const fileRecord = await File.getById(fileId);
    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Get folder record if available
    let folderRecord = null;
    if (fileRecord.FolderID) {
      folderRecord = await Folder.getById(fileRecord.FolderID);
    }

    const result = await documentIndexingService.indexFile(fileRecord, folderRecord);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error indexing file', 'AIRoutes', {
      fileId: req.params.fileId,
      errorMessage: error.message
    }, error);
    res.status(500).json({
      success: false,
      error: 'Failed to index file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/reset-failed-indexes
 * Reset failed indexing attempts - clears errors and sets ForceReindex flag
 */
router.post('/reset-failed-indexes', checkEmbeddingService, async (req, res) => {
  try {
    const { sql, getConnection } = require('../config/database');
    const pool = await getConnection();
    const request = pool.request();

    // First, count how many files will be affected
    const countResult = await request.query(`
      SELECT COUNT(*) AS Count
      FROM cor_Files
      WHERE MimeType = 'application/pdf'
        AND IsActive = 1
        AND IndexingError IS NOT NULL
    `);
    const affectedRows = countResult.recordset[0]?.Count || 0;

    // Update all files with indexing errors to clear error and set ForceReindex
    if (affectedRows > 0) {
      await request.query(`
        UPDATE cor_Files
        SET IndexingError = NULL,
            ForceReindex = 1,
            IsIndexed = 0
        WHERE MimeType = 'application/pdf'
          AND IsActive = 1
          AND IndexingError IS NOT NULL
      `);
    }

    logger.info('Reset failed indexes', 'AIRoutes', {
      affectedRows
    });

    res.json({
      success: true,
      message: `Reset ${affectedRows} failed indexing attempts. They will be re-indexed on the next run.`,
      data: {
        affectedRows
      }
    });
  } catch (error) {
    logger.error('Error resetting failed indexes', 'AIRoutes', {
      errorMessage: error.message
    }, error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset failed indexes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ai/vector-stats
 * Get vector database statistics
 */
router.get('/vector-stats', checkAIService, async (req, res) => {
  try {
    const stats = await vectorDatabaseService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting vector stats', 'AIRoutes', {}, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vector database stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

