const { OpenAI } = require('openai');
const config = require('../../config');
const { logger } = require('../../utils/logger');

/**
 * Embedding Service
 * Generates embeddings for text using OpenAI's embedding API
 */
class EmbeddingService {
  constructor() {
    this.client = null;
    this.isEnabled = false;

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        this.client = new OpenAI({
          apiKey: apiKey.trim()
        });
        this.isEnabled = true;
        logger.info('Embedding Service initialized', 'EmbeddingService');
      } catch (error) {
        logger.error('Failed to initialize Embedding Service', 'EmbeddingService', {
          errorMessage: error.message
        }, error);
        this.isEnabled = false;
      }
    } else {
      logger.warn('OPENAI_API_KEY not found, Embedding Service disabled', 'EmbeddingService');
    }
  }

  /**
   * Check if embedding service is enabled
   */
  isServiceEnabled() {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Generate embeddings for text
   * @param {string|Array<string>} text - Text or array of texts to embed
   * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
   */
  async generateEmbeddings(text) {
    if (!this.isServiceEnabled()) {
      throw new Error('Embedding Service is not enabled. Please configure OPENAI_API_KEY.');
    }

    try {
      const texts = Array.isArray(text) ? text : [text];

      logger.info('Generating embeddings', 'EmbeddingService', {
        textCount: texts.length,
        totalChars: texts.reduce((sum, t) => sum + t.length, 0)
      });

      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small', // Cost-effective and fast
        input: texts
      });

      const embeddings = response.data.map(item => item.embedding);

      logger.info('Embeddings generated', 'EmbeddingService', {
        count: embeddings.length,
        dimension: embeddings[0]?.length || 0
      });

      return Array.isArray(text) ? embeddings : embeddings[0];
    } catch (error) {
      logger.error('Error generating embeddings', 'EmbeddingService', {
        errorMessage: error.message,
        errorType: error.constructor.name
      }, error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }
}

module.exports = new EmbeddingService();

