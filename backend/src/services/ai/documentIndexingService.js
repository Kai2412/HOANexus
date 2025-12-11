const documentExtractionService = require('./documentExtractionService');
const embeddingService = require('./embeddingService');
const vectorDatabaseService = require('./vectorDatabaseService');
const financialExtractionService = require('./financialExtractionService');
const storageService = require('../storageService');
const { logger } = require('../../utils/logger');
const crypto = require('crypto');

/**
 * Document Indexing Service
 * Processes PDF files and indexes them in the vector database
 */
class DocumentIndexingService {
  /**
   * Calculate SHA-256 hash of file content
   * @param {Buffer} fileBuffer - File content buffer
   * @returns {string} SHA-256 hash (hex string)
   */
  calculateFileHash(fileBuffer) {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }


  /**
   * Update file indexing status in database
   * @param {string} fileId - File ID
   * @param {Object} status - Indexing status
   * @returns {Promise<void>}
   */
  async updateIndexingStatus(fileId, status) {
    const { sql, getConnection } = require('../../config/database');
    const pool = await getConnection();
    const request = pool.request();

    const updates = [];
    const params = {};

    if (status.isIndexed !== undefined) {
      updates.push('IsIndexed = @isIndexed');
      request.input('isIndexed', sql.Bit, status.isIndexed ? 1 : 0);
    }
    if (status.lastIndexedDate !== undefined) {
      updates.push('LastIndexedDate = @lastIndexedDate');
      request.input('lastIndexedDate', sql.DateTime2, status.lastIndexedDate);
    }
    if (status.indexingVersion !== undefined) {
      updates.push('IndexingVersion = @indexingVersion');
      request.input('indexingVersion', sql.Int, status.indexingVersion);
    }
    if (status.fileHash !== undefined) {
      updates.push('FileHash = @fileHash');
      request.input('fileHash', sql.NVarChar(64), status.fileHash);
    }
    if (status.indexingError !== undefined) {
      updates.push('IndexingError = @indexingError');
      request.input('indexingError', sql.NVarChar(sql.MAX), status.indexingError);
    }
    if (status.chunkCount !== undefined) {
      updates.push('ChunkCount = @chunkCount');
      request.input('chunkCount', sql.Int, status.chunkCount);
    }
    if (status.forceReindex !== undefined) {
      updates.push('ForceReindex = @forceReindex');
      request.input('forceReindex', sql.Bit, status.forceReindex ? 1 : 0);
    }

    if (updates.length === 0) return;

    request.input('fileId', sql.UniqueIdentifier, fileId);
    await request.query(`
      UPDATE cor_Files
      SET ${updates.join(', ')}
      WHERE FileID = @fileId
    `);
  }

  /**
   * Index a single PDF file
   * @param {Object} fileRecord - File record from database
   * @param {Object} folderRecord - Folder record from database
   * @returns {Promise<Object>} Indexing result
   */
  async indexFile(fileRecord, folderRecord = null) {
    try {
      logger.info('Checking file for indexing', 'DocumentIndexingService', {
        fileId: fileRecord.FileID,
        fileName: fileRecord.FileName,
        isIndexed: fileRecord.IsIndexed,
        hasError: !!fileRecord.IndexingError
      });

      // Only index PDF files
      if (fileRecord.MimeType !== 'application/pdf') {
        logger.info('Skipping non-PDF file', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          mimeType: fileRecord.MimeType
        });
        return { skipped: true, reason: 'Not a PDF file' };
      }

      // Check if already indexed and file hasn't changed
      // Skip this check if ForceReindex is set (we want to force re-index)
      let shouldSkipVectorIndexing = false;
      let fileHash = null;
      let extractedData = null;
      
      if (fileRecord.IsIndexed && !fileRecord.ForceReindex) {
        // Download file to calculate hash
        const blobPath = this.extractBlobPath(fileRecord.FilePath);
        const fileBuffer = await storageService.downloadFile(blobPath);
        const currentHash = this.calculateFileHash(fileBuffer);
        fileHash = currentHash;

        // If hash matches, skip vector indexing (but still check for financial extraction)
        if (fileRecord.FileHash === currentHash) {
          logger.info('File already indexed and unchanged - skipping vector indexing, but checking financial extraction', 'DocumentIndexingService', {
            fileId: fileRecord.FileID,
            fileName: fileRecord.FileName
          });
          shouldSkipVectorIndexing = true;
          
          // Check if this might be a financial statement that needs extraction
          // Only extract text if it's a financial statement and we haven't extracted financial data yet
          if (financialExtractionService.isServiceEnabled() && 
              financialExtractionService.isFinancialStatement(fileRecord.FileName) &&
              fileRecord.CommunityID) {
            // Quick check: does financial data already exist for this file?
            const { sql, getConnection: getDbConnection } = require('../../config/database');
            const pool = await getDbConnection();
            const checkRequest = pool.request();
            const dateInfo = financialExtractionService.extractDateFromFilename(fileRecord.FileName);
            
            if (dateInfo) {
              const existingFinancialData = await checkRequest
                .input('CommunityID', sql.UniqueIdentifier, fileRecord.CommunityID)
                .input('StatementYear', sql.Int, dateInfo.year)
                .input('StatementMonth', sql.Int, dateInfo.month)
                .query(`
                  SELECT FinancialDataID
                  FROM cor_FinancialData
                  WHERE CommunityID = @CommunityID
                    AND StatementYear = @StatementYear
                    AND StatementMonth = @StatementMonth
                    AND IsActive = 1
                `);
              
              if (existingFinancialData.recordset.length > 0) {
                logger.info('Financial data already exists for this file - skipping extraction', 'DocumentIndexingService', {
                  fileId: fileRecord.FileID,
                  fileName: fileRecord.FileName
                });
                // Don't extract text, financial data already exists
              } else {
                logger.info('File already indexed but needs financial extraction - extracting text', 'DocumentIndexingService', {
                  fileId: fileRecord.FileID,
                  fileName: fileRecord.FileName
                });
                extractedData = await documentExtractionService.extractTextFromPDF(blobPath);
              }
            } else {
              // Can't extract date from filename, still try to extract text
              logger.info('File already indexed but may need financial extraction - extracting text (date unknown)', 'DocumentIndexingService', {
                fileId: fileRecord.FileID,
                fileName: fileRecord.FileName
              });
              extractedData = await documentExtractionService.extractTextFromPDF(blobPath);
            }
          }
        } else {
          // Hash changed - file was updated, need to re-index
          logger.info('File hash changed, re-indexing', 'DocumentIndexingService', {
            fileId: fileRecord.FileID,
            fileName: fileRecord.FileName,
            oldHash: fileRecord.FileHash?.substring(0, 8),
            newHash: currentHash.substring(0, 8)
          });
        }
      } else if (fileRecord.IsIndexed && fileRecord.ForceReindex) {
        // ForceReindex is set - log that we're forcing re-index
        logger.info('Force re-indexing file', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName
        });
      }

      // Check if indexing previously failed (skip unless ForceReindex)
      if (fileRecord.IndexingError && !fileRecord.ForceReindex) {
        logger.warn('Skipping file with previous indexing error', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName,
          error: fileRecord.IndexingError.substring(0, 100)
        });
        return { skipped: true, reason: 'Previous indexing error', error: fileRecord.IndexingError };
      }

      // Clear any previous error if ForceReindex is set
      if (fileRecord.ForceReindex) {
        await this.updateIndexingStatus(fileRecord.FileID, {
          indexingError: null,
          forceReindex: false
        });
      }

      // Only do full indexing if not skipping
      let vectorChunks = [];
      if (!shouldSkipVectorIndexing) {
        logger.info('Indexing file', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName,
          fileType: fileRecord.FileType
        });

        // Download file and calculate hash
        const blobPath = this.extractBlobPath(fileRecord.FilePath);
        const fileBuffer = await storageService.downloadFile(blobPath);
        fileHash = this.calculateFileHash(fileBuffer);

        // Extract text from PDF
        extractedData = await documentExtractionService.extractTextFromPDF(blobPath);

        // Check if PDF has extractable text
        if (!extractedData.text || extractedData.text.trim().length === 0) {
          const numPages = extractedData.metadata?.numPages || 0;
          logger.warn('PDF contains no extractable text - image-based/scanned document detected', 'DocumentIndexingService', {
            fileId: fileRecord.FileID,
            fileName: fileRecord.FileName,
            numPages: numPages
          });
          return { 
            skipped: true, 
            reason: `Image-based PDF detected (${numPages} pages) - OCR required for text extraction` 
          };
        }

        // Chunk the text
        const chunks = documentExtractionService.chunkText(extractedData.text, 1000, 200);

        // Generate embeddings for all chunks
        const chunkTexts = chunks.map(chunk => chunk.text);
        const embeddings = await embeddingService.generateEmbeddings(chunkTexts);

        // Prepare chunks for vector database
        vectorChunks = chunks.map((chunk, index) => ({
          id: `${fileRecord.FileID}-chunk-${index}`,
          text: chunk.text,
          embedding: embeddings[index],
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName,
          folderId: folderRecord?.FolderID || null,
          folderName: folderRecord?.FolderName || null,
          communityId: fileRecord.CommunityID || null,
          folderType: folderRecord?.FolderType || fileRecord.FolderType || null,
          fileType: fileRecord.FileType || null,
          chunkIndex: index,
          pageNumber: this.getPageNumberForChunk(chunk, extractedData.pageTexts),
          createdAt: fileRecord.CreatedOn || new Date().toISOString()
        }));

        // Add to vector database
        await vectorDatabaseService.addDocuments(vectorChunks);
      } else {
        // File already indexed, but we may still need to extract financial data
        // extractedData should already be set above if needed
        logger.info('Skipping vector indexing for already-indexed file', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName
        });
      }

      // Check if this is a financial statement and extract structured data
      // This runs even if vector indexing was skipped (for already-indexed files)
      let financialDataExtracted = false;
      
      // Debug logging to see why extraction might not trigger
      const isServiceEnabled = financialExtractionService.isServiceEnabled();
      const isFinancial = financialExtractionService.isFinancialStatement(fileRecord.FileName);
      const hasCommunityId = !!fileRecord.CommunityID;
      
      logger.info('Checking financial extraction conditions', 'DocumentIndexingService', {
        fileId: fileRecord.FileID,
        fileName: fileRecord.FileName,
        isServiceEnabled,
        isFinancial,
        hasCommunityId,
        communityId: fileRecord.CommunityID,
        hasExtractedText: !!extractedData?.text
      });
      
      if (isServiceEnabled && isFinancial && hasCommunityId && extractedData?.text) {
        try {
          logger.info('Detected financial statement, extracting structured data', 'DocumentIndexingService', {
            fileId: fileRecord.FileID,
            fileName: fileRecord.FileName,
            communityId: fileRecord.CommunityID,
            alreadyIndexed: shouldSkipVectorIndexing
          });

          const financialData = await financialExtractionService.extractFinancialData(
            extractedData.text,
            fileRecord.FileName
          );

          // Save to database
          await financialExtractionService.saveFinancialData(
            fileRecord.CommunityID,
            fileRecord.FileID,
            financialData
          );

          financialDataExtracted = true;
          logger.info('Financial data extracted and saved', 'DocumentIndexingService', {
            fileId: fileRecord.FileID,
            year: financialData.statementYear,
            month: financialData.statementMonth
          });
        } catch (financialError) {
          // Don't fail indexing if financial extraction fails - log and continue
          logger.warn('Financial extraction failed, continuing with regular indexing', 'DocumentIndexingService', {
            fileId: fileRecord.FileID,
            error: financialError.message
          });
        }
      } else if (isFinancial && !extractedData?.text) {
        logger.warn('Financial statement detected but no text extracted - cannot extract financial data', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName
        });
      }

      // Update database with indexing status (only if we did vector indexing)
      if (!shouldSkipVectorIndexing) {
        await this.updateIndexingStatus(fileRecord.FileID, {
          isIndexed: true,
          lastIndexedDate: new Date(),
          indexingVersion: 1, // Current version
          fileHash: fileHash,
          indexingError: null, // Clear any previous errors
          chunkCount: vectorChunks.length,
          forceReindex: false // Clear force reindex flag
        });
      }

      logger.info('File processing completed', 'DocumentIndexingService', {
        fileId: fileRecord.FileID,
        chunksCount: vectorChunks.length,
        textLength: extractedData?.text?.length || 0,
        financialDataExtracted,
        vectorIndexingSkipped: shouldSkipVectorIndexing
      });

      return {
        success: true,
        fileId: fileRecord.FileID,
        chunksCount: vectorChunks.length,
        textLength: extractedData?.text?.length || 0,
        numPages: extractedData?.metadata?.numPages || 0,
        financialDataExtracted,
        vectorIndexingSkipped: shouldSkipVectorIndexing
      };
    } catch (error) {
      logger.error('Error indexing file', 'DocumentIndexingService', {
        fileId: fileRecord.FileID,
        errorMessage: error.message
      }, error);

      // Update database with error status
      try {
        await this.updateIndexingStatus(fileRecord.FileID, {
          isIndexed: false,
          indexingError: error.message.substring(0, 4000) // Limit error message length
        });
      } catch (updateError) {
        logger.error('Failed to update indexing error status', 'DocumentIndexingService', {
          fileId: fileRecord.FileID,
          error: updateError.message
        });
      }

      throw error;
    }
  }

  /**
   * Index all PDF files in the database
   * @param {Object} options - Indexing options
   * @param {string} options.communityId - Filter by community ID (optional)
   * @param {string} options.folderType - Filter by folder type (optional)
   * @returns {Promise<Object>} Indexing summary
   */
  async indexAllFiles(options = {}) {
    try {
      const { sql, getConnection } = require('../../config/database');
      const pool = await getConnection();
      const request = pool.request();

      // Build query to get all PDF files that need indexing
      // Include files that:
      // 1. Haven't been indexed yet (IsIndexed = 0)
      // 2. Have ForceReindex flag set (ForceReindex = 1)
      // 3. Are already indexed but might be financial statements needing financial extraction
      //    (check if filename contains 'financial' or 'statement' and has CommunityID)
      let query = `
        SELECT 
          f.FileID,
          f.FolderID,
          f.CommunityID,
          f.FileName,
          f.FileNameStored,
          f.FilePath,
          f.FileSize,
          f.MimeType,
          f.FileType,
          f.FolderType,
          f.CreatedOn,
          f.CreatedBy,
          f.IsIndexed,
          f.LastIndexedDate,
          f.IndexingVersion,
          f.FileHash,
          f.IndexingError,
          f.ChunkCount,
          f.ForceReindex,
          fo.FolderName,
          fo.FolderType AS FolderFolderType
        FROM cor_Files f
        LEFT JOIN cor_Folders fo ON f.FolderID = fo.FolderID
        LEFT JOIN cor_FinancialData fd ON f.FileID = fd.FileID AND fd.IsActive = 1
        WHERE f.MimeType = 'application/pdf'
          AND f.IsActive = 1
          AND (
            f.IsIndexed = 0 
            OR f.ForceReindex = 1
            OR (
              f.IsIndexed = 1 
              AND f.CommunityID IS NOT NULL
              AND (LOWER(f.FileName) LIKE '%financial%' OR LOWER(f.FileName) LIKE '%statement%')
              AND fd.FinancialDataID IS NULL
            )
          )
      `;

      if (options.communityId) {
        query += ` AND f.CommunityID = @communityId`;
        request.input('communityId', sql.UniqueIdentifier, options.communityId);
      }

      if (options.folderType) {
        query += ` AND (f.FolderType = @folderType OR fo.FolderType = @folderType)`;
        request.input('folderType', sql.NVarChar(50), options.folderType);
      }

      const result = await request.query(query);
      const files = result.recordset;

      logger.info('Starting bulk file indexing', 'DocumentIndexingService', {
        fileCount: files.length,
        filters: options
      });

      const results = {
        total: files.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        skippedFiles: [], // Track which files were skipped and why
        processedFiles: [] // Detailed log of all processed files
      };

      // Process files in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (file) => {
            const fileLog = {
              fileId: file.FileID,
              fileName: file.FileName,
              status: 'processing',
              timestamp: new Date().toISOString(),
              details: {}
            };

            try {
              const folder = file.FolderID ? {
                FolderID: file.FolderID,
                FolderName: file.FolderName,
                FolderType: file.FolderFolderType || file.FolderType
              } : null;

              const result = await this.indexFile(file, folder);
              
              if (result.success) {
                results.successful++;
                fileLog.status = 'success';
                fileLog.details = {
                  chunksCount: result.chunksCount || 0,
                  textLength: result.textLength || 0,
                  numPages: result.numPages || 0,
                  financialDataExtracted: result.financialDataExtracted || false,
                  vectorIndexingSkipped: result.vectorIndexingSkipped || false
                };
              } else if (result.skipped) {
                results.skipped++;
                fileLog.status = 'skipped';
                fileLog.details = {
                  reason: result.reason,
                  error: result.error || null
                };
                // Track skipped files with reason
                results.skippedFiles.push({
                  fileId: file.FileID,
                  fileName: file.FileName,
                  reason: result.reason,
                  error: result.error || null
                });
                // If skipped due to error, count as failed
                if (result.error) {
                  results.failed++;
                  fileLog.status = 'failed';
                  results.errors.push({
                    fileId: file.FileID,
                    fileName: file.FileName,
                    error: result.error
                  });
                }
              }
            } catch (error) {
              results.failed++;
              fileLog.status = 'failed';
              fileLog.details = {
                error: error.message
              };
              results.errors.push({
                fileId: file.FileID,
                fileName: file.FileName,
                error: error.message
              });
            } finally {
              results.processedFiles.push(fileLog);
            }
          })
        );
      }

      logger.info('Bulk file indexing completed', 'DocumentIndexingService', results);

      return results;
    } catch (error) {
      logger.error('Error in bulk file indexing', 'DocumentIndexingService', {
        errorMessage: error.message
      }, error);
      throw error;
    }
  }

  /**
   * Extract blob path from file URL
   * @param {string} filePath - File path/URL
   * @returns {string} Blob path
   */
  extractBlobPath(filePath) {
    // FilePath might be a full URL (Azure production or Azurite local) or just a blob path
    // Extract the blob path portion after the container name
    
    // Check if it's a full URL (Azure production or Azurite)
    if (filePath.includes('http://') || filePath.includes('https://')) {
      const urlParts = filePath.split('/');
      // Find the container name in the URL
      const containerIndex = urlParts.findIndex(part => part === 'hoa-nexus-files' || part.includes('hoa-nexus-files'));
      if (containerIndex !== -1) {
        // Extract everything after the container name
        const blobPath = urlParts.slice(containerIndex + 1).join('/');
        // URL-decode in case of encoded characters
        return decodeURIComponent(blobPath);
      }
      // If container not found, return original (shouldn't happen)
      return filePath;
    }
    
    // Assume it's already a blob path
    return filePath;
  }

  /**
   * Determine which page a chunk belongs to
   * @param {Object} chunk - Chunk object
   * @param {Array<Object>} pageTexts - Array of page texts
   * @returns {number|null} Page number
   */
  getPageNumberForChunk(chunk, pageTexts) {
    // Simple heuristic: find the page that contains the chunk's start position
    let charCount = 0;
    for (let i = 0; i < pageTexts.length; i++) {
      charCount += pageTexts[i].text.length + 2; // +2 for newlines
      if (chunk.startIndex < charCount) {
        return pageTexts[i].pageNumber;
      }
    }
    return null;
  }
}

module.exports = new DocumentIndexingService();

