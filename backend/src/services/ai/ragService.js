const embeddingService = require('./embeddingService');
const vectorDatabaseService = require('./vectorDatabaseService');
const { logger } = require('../../utils/logger');

/**
 * RAG (Retrieval Augmented Generation) Service
 * Retrieves relevant document chunks based on user queries
 */
class RAGService {
  /**
   * Retrieve relevant document chunks for a query
   * @param {string} query - User's question/query
   * @param {Object} options - Search options
   * @param {number} options.limit - Number of results (default: 5)
   * @param {string} options.communityId - Filter by community (optional)
   * @param {string} options.folderType - Filter by folder type (optional)
   * @returns {Promise<Array<Object>>} Relevant document chunks with context
   */
  async retrieveRelevantDocuments(query, options = {}) {
    try {
      if (!embeddingService.isServiceEnabled()) {
        logger.warn('Embedding service not enabled, skipping RAG retrieval', 'RAGService');
        return [];
      }

      logger.info('Retrieving relevant documents', 'RAGService', {
        query: query.substring(0, 100),
        options
      });

      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbeddings(query);

      // Build search filters
      // Note: ChromaDB doesn't support null filters, so Corporate documents (communityId=null)
      // need special handling - we'll search all and filter results
      const where = {};
      const searchAll = !options.communityId && !options.folderType; // Search all if no filters
      const searchCorporateOnly = options.folderType === 'Corporate' && !options.communityId;
      
      if (options.communityId) {
        where.communityId = options.communityId;
      }
      if (options.folderType && !searchCorporateOnly) {
        // Only add folderType filter if not searching Corporate (which needs post-filtering)
        where.folderType = options.folderType;
      }

      // Search vector database
      // For Corporate-only search, we search all then filter (since Corporate has communityId=null)
      const searchLimit = searchCorporateOnly ? (options.limit || 5) * 2 : (options.limit || 5); // Get more results to filter
      const results = await vectorDatabaseService.search(queryEmbedding, {
        limit: searchAll || searchCorporateOnly ? searchLimit : (options.limit || 5),
        where: Object.keys(where).length > 0 && !searchCorporateOnly ? where : undefined
      });

      // Format results with source information and apply post-filtering if needed
      let formattedResults = results.map(result => ({
        text: result.text,
        score: result.score,
        source: {
          fileId: result.metadata.fileId,
          fileName: result.metadata.fileName,
          folderName: result.metadata.folderName,
          communityId: result.metadata.communityId,
          folderType: result.metadata.folderType,
          pageNumber: result.metadata.pageNumber,
          chunkIndex: result.metadata.chunkIndex,
          createdDate: result.metadata.createdAt || result.metadata.createdDate || null
        }
      }));
      
      // Post-filter for Corporate documents (communityId is null/undefined for Corporate)
      if (searchCorporateOnly) {
        formattedResults = formattedResults.filter(result => 
          !result.source.communityId && result.source.folderType === 'Corporate'
        ).slice(0, options.limit || 5); // Limit after filtering
      }
      
      // Post-filter for Community documents if communityId filter was applied
      if (options.communityId) {
        formattedResults = formattedResults.filter(result => 
          result.source.communityId === options.communityId
        );
      }

      logger.info('Document retrieval completed', 'RAGService', {
        resultsCount: formattedResults.length,
        averageScore: formattedResults.reduce((sum, r) => sum + r.score, 0) / formattedResults.length || 0
      });

      return formattedResults;
    } catch (error) {
      logger.error('Error retrieving relevant documents', 'RAGService', {
        query: query.substring(0, 100),
        errorMessage: error.message
      }, error);
      // Don't throw - return empty array so chat can continue without RAG
      return [];
    }
  }

  /**
   * Format retrieved documents as context for Claude
   * @param {Array<Object>} documents - Retrieved document chunks
   * @returns {string} Formatted context string
   */
  formatDocumentsAsContext(documents) {
    if (!documents || documents.length === 0) {
      return '';
    }

    let context = '\n\n--- RELEVANT DOCUMENTS (SUPPORTING/SECONDARY SOURCE) ---\n\n';
    context += 'NOTE: These documents are supplementary. For structured data (fees, invoices, etc.), database queries are the primary source of truth.\n\n';
    
    documents.forEach((doc, index) => {
      context += `[Document ${index + 1}]\n`;
      context += `Source: ${doc.source.fileName}`;
      if (doc.source.folderName) {
        context += ` (${doc.source.folderName})`;
      }
      if (doc.source.createdDate) {
        context += ` | Created: ${doc.source.createdDate}`;
      }
      if (doc.source.pageNumber) {
        context += ` | Page ${doc.source.pageNumber}`;
      }
      context += `\nRelevance: ${(doc.score * 100).toFixed(1)}%\n\n`;
      context += `${doc.text}\n\n`;
      context += '---\n\n';
    });

    return context;
  }

  /**
   * Detect if a query is document-related
   * @param {string} query - User's question
   * @returns {boolean} True if query seems document-related
   */
  isDocumentQuery(query) {
    const documentKeywords = [
      'document', 'pdf', 'file', 'contract', 'agreement', 'policy',
      'rule', 'regulation', 'bylaw', 'ccr', 'governing document',
      'what does', 'what says', 'according to', 'states that',
      'mentions', 'references', 'says about'
    ];

    const lowerQuery = query.toLowerCase();
    return documentKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}

module.exports = new RAGService();

