/**
 * Script to index all PDF documents in the database
 * Run with: node src/scripts/indexDocuments.js
 */

require('dotenv').config();
const documentIndexingService = require('../services/ai/documentIndexingService');
const { logger } = require('../utils/logger');

async function indexAllDocuments() {
  try {
    console.log('🚀 Starting document indexing...\n');

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ ERROR: OPENAI_API_KEY not found in .env file');
      console.log('💡 Please add OPENAI_API_KEY=sk-your-key-here to your backend/.env file');
      process.exit(1);
    }

    console.log('📄 Indexing all PDF documents in the database...\n');

    const result = await documentIndexingService.indexAllFiles();

    console.log('\n✅ Indexing completed!');
    console.log(`📊 Results:`);
    console.log(`   - Total files: ${result.total}`);
    console.log(`   - Successfully indexed: ${result.successful}`);
    console.log(`   - Failed: ${result.failed}`);
    console.log(`   - Skipped: ${result.skipped}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.fileName}: ${error.error}`);
      });
    }

    console.log('\n✨ Your documents are now searchable by the AI assistant!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during indexing:', error.message);
    logger.error('Error in index documents script', 'IndexScript', {}, error);
    process.exit(1);
  }
}

// Run the script
indexAllDocuments();

