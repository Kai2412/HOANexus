const storageService = require('../storageService');
const { logger } = require('../../utils/logger');

// pdfjs-dist v5+ uses ES modules, so we need to use dynamic import
let pdfjsLib = null;
async function getPdfjsLib() {
  if (!pdfjsLib) {
    const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib = pdfjsModule; // The module exports getDocument as a named export
  }
  return pdfjsLib;
}

/**
 * Document Extraction Service
 * Extracts text content from PDF files stored in Azure Blob Storage
 */
class DocumentExtractionService {
  /**
   * Extract text from a PDF file
   * @param {string} blobPath - Path to the PDF in blob storage
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractTextFromPDF(blobPath) {
    try {
      logger.info('Extracting text from PDF', 'DocumentExtractionService', { blobPath });

      // Get pdfjs library (dynamic import for ES modules)
      const pdfjs = await getPdfjsLib();

      // Download PDF from blob storage
      const pdfBuffer = await storageService.downloadFile(blobPath);

      // Convert Buffer to Uint8Array (pdfjs-dist requires Uint8Array, not Buffer)
      const pdfData = new Uint8Array(pdfBuffer);

      // Load PDF document (getDocument is a named export)
      const loadingTask = pdfjs.getDocument({
        data: pdfData,
        verbosity: 0 // Suppress console warnings
      });

      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      logger.info('PDF loaded', 'DocumentExtractionService', {
        blobPath,
        numPages
      });

      // Extract text from all pages
      let fullText = '';
      const pageTexts = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();

        pageTexts.push({
          pageNumber: pageNum,
          text: pageText
        });

        fullText += pageText + '\n\n';
      }

      // Extract metadata if available
      const metadata = await pdfDocument.getMetadata().catch(() => null);
      const info = await pdfDocument.getMetadata().catch(() => null);

      const result = {
        text: fullText.trim(),
        pageTexts,
        metadata: {
          numPages,
          title: info?.Title || null,
          author: info?.Author || null,
          subject: info?.Subject || null,
          creator: info?.Creator || null,
          producer: info?.Producer || null,
          creationDate: info?.CreationDate || null,
          modificationDate: info?.ModDate || null
        }
      };

      logger.info('PDF text extraction completed', 'DocumentExtractionService', {
        blobPath,
        numPages,
        textLength: fullText.length,
        hasMetadata: !!metadata
      });

      return result;
    } catch (error) {
      logger.error('Error extracting text from PDF', 'DocumentExtractionService', {
        blobPath,
        errorMessage: error.message
      }, error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   * @param {string} text - Full text to chunk
   * @param {number} chunkSize - Maximum characters per chunk
   * @param {number} overlap - Characters to overlap between chunks
   * @returns {Array<Object>} Array of text chunks with metadata
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      let chunk = text.slice(startIndex, endIndex);

      // Try to break at sentence boundaries (period, newline, or paragraph break)
      if (endIndex < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > chunkSize * 0.5) { // Only break if we're at least halfway through
          chunk = text.slice(startIndex, startIndex + breakPoint + 1);
          startIndex = startIndex + breakPoint + 1 - overlap;
        } else {
          startIndex = endIndex - overlap;
        }
      } else {
        startIndex = endIndex;
      }

      chunks.push({
        text: chunk.trim(),
        startIndex,
        endIndex: startIndex + chunk.length
      });
    }

    logger.info('Text chunked', 'DocumentExtractionService', {
      totalChunks: chunks.length,
      averageChunkSize: chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length
    });

    return chunks;
  }
}

module.exports = new DocumentExtractionService();

