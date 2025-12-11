const { ChromaClient } = require('chromadb');
const { logger } = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Vector Database Service
 * Manages document embeddings in ChromaDB
 */
class VectorDatabaseService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = 'hoa-nexus-documents';
    this.initialized = false;
  }

  /**
   * Initialize ChromaDB client and collection
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // ChromaDB v3+ requires a server connection (Docker container)
      const serverHost = process.env.CHROMA_SERVER_HOST || 'localhost';
      const serverPort = process.env.CHROMA_SERVER_PORT ? parseInt(process.env.CHROMA_SERVER_PORT) : 8000;
      
      // Connect to ChromaDB server
      logger.info('Connecting to ChromaDB server', 'VectorDatabaseService', {
        host: serverHost,
        port: serverPort
      });
      
      this.client = new ChromaClient({
        host: serverHost,
        port: serverPort
      });
      
      // Test the connection
      try {
        await this.client.listCollections();
        logger.info('ChromaDB client initialized successfully', 'VectorDatabaseService', {
          mode: 'server',
          host: serverHost,
          port: serverPort
        });
      } catch (error) {
        logger.error('ChromaDB connection failed', 'VectorDatabaseService', {
          error: error.message,
          host: serverHost,
          port: serverPort
        });
        throw new Error(`Failed to connect to ChromaDB server at ${serverHost}:${serverPort}. Make sure the server is running: npm run chromadb (requires Docker Desktop)`);
      }

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName
        });
        logger.info('Connected to existing ChromaDB collection', 'VectorDatabaseService', {
          collectionName: this.collectionName
        });
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'HOA Nexus document embeddings'
          }
        });
        logger.info('Created new ChromaDB collection', 'VectorDatabaseService', {
          collectionName: this.collectionName
        });
      }

      this.initialized = true;
      logger.info('Vector Database Service initialized', 'VectorDatabaseService', {
        collectionName: this.collectionName,
        host: serverHost,
        port: serverPort
      });
    } catch (error) {
      logger.error('Error initializing Vector Database', 'VectorDatabaseService', {
        errorMessage: error.message
      }, error);
      throw error;
    }
  }

  /**
   * Add document chunks to vector database
   * @param {Array<Object>} chunks - Array of chunks with text, embedding, and metadata
   * @returns {Promise<void>}
   */
  async addDocuments(chunks) {
    await this.initialize();

    try {
      const ids = [];
      const embeddings = [];
      const documents = [];
      const metadatas = [];

      for (const chunk of chunks) {
        ids.push(chunk.id);
        embeddings.push(chunk.embedding);
        documents.push(chunk.text);
        
        // Build metadata object, only including non-null values
        // ChromaDB doesn't accept null values - must be string, number, boolean, or omitted
        const metadata = {
          fileId: String(chunk.fileId),
          fileName: String(chunk.fileName || ''),
          chunkIndex: Number(chunk.chunkIndex || 0),
          createdAt: String(chunk.createdAt || new Date().toISOString())
        };
        
        // Only add optional fields if they have values
        if (chunk.folderId) metadata.folderId = String(chunk.folderId);
        if (chunk.folderName) metadata.folderName = String(chunk.folderName);
        if (chunk.communityId) metadata.communityId = String(chunk.communityId);
        if (chunk.folderType) metadata.folderType = String(chunk.folderType);
        if (chunk.fileType) metadata.fileType = String(chunk.fileType);
        if (chunk.pageNumber !== null && chunk.pageNumber !== undefined) {
          metadata.pageNumber = Number(chunk.pageNumber);
        }
        if (chunk.isImageBased !== null && chunk.isImageBased !== undefined) {
          metadata.isImageBased = Boolean(chunk.isImageBased);
        }
        
        metadatas.push(metadata);
      }

      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });

      logger.info('Documents added to vector database', 'VectorDatabaseService', {
        count: chunks.length
      });
    } catch (error) {
      logger.error('Error adding documents to vector database', 'VectorDatabaseService', {
        errorMessage: error.message,
        chunkCount: chunks.length
      }, error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {Object} options - Search options
   * @param {number} options.limit - Number of results to return (default: 5)
   * @param {Object} options.where - Metadata filters (e.g., { communityId: '...', folderType: 'Corporate' })
   * @returns {Promise<Array<Object>>} Array of similar documents with scores
   */
  async search(queryEmbedding, options = {}) {
    await this.initialize();

    try {
      const limit = options.limit || 5;
      const where = options.where || {};

      logger.info('Searching vector database', 'VectorDatabaseService', {
        limit,
        filters: where
      });

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: Object.keys(where).length > 0 ? where : undefined
      });

      // Format results
      const formattedResults = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          formattedResults.push({
            id: results.ids[0][i],
            text: results.documents[0][i],
            metadata: results.metadatas[0][i],
            distance: results.distances[0][i],
            score: 1 - results.distances[0][i] // Convert distance to similarity score
          });
        }
      }

      logger.info('Vector search completed', 'VectorDatabaseService', {
        resultsCount: formattedResults.length
      });

      return formattedResults;
    } catch (error) {
      logger.error('Error searching vector database', 'VectorDatabaseService', {
        errorMessage: error.message
      }, error);
      throw error;
    }
  }

  /**
   * Delete documents by file ID (useful when file is deleted)
   * @param {string} fileId - File ID to delete
   * @returns {Promise<void>}
   */
  async deleteByFileId(fileId) {
    await this.initialize();

    try {
      // ChromaDB doesn't have a direct delete by metadata, so we need to query first
      const results = await this.collection.get({
        where: { fileId }
      });

      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids
        });

        logger.info('Documents deleted from vector database', 'VectorDatabaseService', {
          fileId,
          deletedCount: results.ids.length
        });
      }
    } catch (error) {
      logger.error('Error deleting documents from vector database', 'VectorDatabaseService', {
        fileId,
        errorMessage: error.message
      }, error);
      throw error;
    }
  }

  /**
   * Get collection stats
   * @returns {Promise<Object>} Collection statistics
   */
  async getStats() {
    await this.initialize();

    try {
      const count = await this.collection.count();
      return {
        collectionName: this.collectionName,
        documentCount: count
      };
    } catch (error) {
      logger.error('Error getting vector database stats', 'VectorDatabaseService', {
        errorMessage: error.message
      }, error);
      throw error;
    }
  }
}

module.exports = new VectorDatabaseService();

