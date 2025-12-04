const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('../config');
const { logger } = require('../utils/logger');

class StorageService {
  constructor() {
    this.connectionString = config.fileStorage.azure.connectionString;
    this.containerName = config.fileStorage.azure.containerName;
    this.useAzurite = config.fileStorage.azure.useAzurite;
    this.blobServiceClient = null;
    this.containerClient = null;
    this.initialized = false;
  }

  /**
   * Initialize the blob service client and ensure container exists
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);

      // Create container if it doesn't exist
      const exists = await this.containerClient.exists();
      if (!exists) {
        // Don't set access property - defaults to private (no public access)
        // Files will only be accessible via our API with proper authentication
        await this.containerClient.create();
        logger.info(`Created blob container: ${this.containerName}`, 'StorageService');
      }

      this.initialized = true;
      logger.info('Azure Blob Storage initialized', 'StorageService', {
        container: this.containerName,
        useAzurite: this.useAzurite
      });
    } catch (error) {
      logger.error('Error initializing blob storage', 'StorageService', undefined, error);
      throw error;
    }
  }

  /**
   * Upload a file to blob storage
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} blobName - Name/path of the blob (e.g., "communities/{communityId}/files/{filename}")
   * @param {string} contentType - MIME type of the file
   * @returns {Promise<string>} Blob URL
   */
  async uploadFile(fileBuffer, blobName, contentType) {
    await this.initialize();

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType
        }
      });

      // Return the blob URL
      return blockBlobClient.url;
    } catch (error) {
      logger.error('Error uploading file to blob storage', 'StorageService', { blobName }, error);
      throw error;
    }
  }

  /**
   * Download a file from blob storage
   * @param {string} blobName - Name/path of the blob
   * @returns {Promise<Buffer>} File content as buffer
   */
  async downloadFile(blobName) {
    await this.initialize();

    try {
      logger.info('Downloading blob', 'StorageService', {
        blobName,
        containerName: this.containerName
      });
      
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Check if blob exists first
      const exists = await blockBlobClient.exists();
      if (!exists) {
        logger.error('Blob does not exist', 'StorageService', {
          blobName,
          containerName: this.containerName,
          fullPath: `${this.containerName}/${blobName}`
        });
        throw new Error(`The specified blob does not exist: ${blobName}`);
      }
      
      const downloadResponse = await blockBlobClient.download(0); // Download from start
      
      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }

      logger.info('Blob downloaded successfully', 'StorageService', {
        blobName,
        size: Buffer.concat(chunks).length
      });

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('Error downloading file from blob storage', 'StorageService', { 
        blobName,
        containerName: this.containerName,
        errorMessage: error.message
      }, error);
      throw error;
    }
  }

  /**
   * Delete a file from blob storage
   * @param {string} blobName - Name/path of the blob
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(blobName) {
    await this.initialize();

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      return true;
    } catch (error) {
      // If file doesn't exist, that's okay
      if (error.statusCode === 404) {
        return true;
      }
      logger.error('Error deleting file from blob storage', 'StorageService', { blobName }, error);
      throw error;
    }
  }

  /**
   * Get a download URL for a blob (with SAS token for private blobs)
   * For now, we'll use the direct blob URL (Azurite allows this)
   * In production, you might want to generate SAS tokens
   * @param {string} blobName - Name/path of the blob
   * @returns {string} Blob URL
   */
  getBlobUrl(blobName) {
    if (!this.containerClient) {
      throw new Error('Storage service not initialized');
    }
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  /**
   * Extract blob name from full blob URL
   * @param {string} blobUrl - Full blob URL
   * @returns {string} Blob name
   */
  getBlobNameFromUrl(blobUrl) {
    // Extract blob name from URL
    // Format: http://127.0.0.1:10000/devstoreaccount1/container/blobname
    const urlParts = blobUrl.split('/');
    const containerIndex = urlParts.findIndex(part => part === this.containerName);
    if (containerIndex === -1) {
      throw new Error('Invalid blob URL');
    }
    const blobName = urlParts.slice(containerIndex + 1).join('/');
    // URL-decode the blob name since Azure SDK returns URL-encoded URLs
    // but blob storage uses the actual blob name (with spaces, not %20)
    return decodeURIComponent(blobName);
  }
}

// Export singleton instance
module.exports = new StorageService();

