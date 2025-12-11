const Anthropic = require('@anthropic-ai/sdk');
const { logger } = require('../../utils/logger');
const { sql, getConnection } = require('../../config/database');

/**
 * Financial Extraction Service
 * Extracts structured financial data from financial statement PDFs using Claude
 */
class FinancialExtractionService {
  constructor() {
    this.client = null;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (apiKey) {
      try {
        this.client = new Anthropic({
          apiKey: apiKey.trim()
        });
        logger.info('Financial Extraction Service initialized', 'FinancialExtractionService');
      } catch (error) {
        logger.error('Failed to initialize Financial Extraction Service', 'FinancialExtractionService', {}, error);
      }
    }
  }

  /**
   * Check if service is enabled
   */
  isServiceEnabled() {
    return this.client !== null;
  }

  /**
   * Extract date from filename
   * Examples: "ACRF-202510-FinancialStatement.pdf" -> { year: 2025, month: 10 }
   *           "ACRF-202501-FinancialStatement.pdf" -> { year: 2025, month: 1 }
   */
  extractDateFromFilename(fileName) {
    // Pattern: ACRF-202510 or ACRF-202501
    const match = fileName.match(/(\d{4})(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      // Statement date is typically end of month
      const statementDate = new Date(year, month, 0); // Last day of month
      return {
        year,
        month,
        statementDate: statementDate.toISOString().split('T')[0] // YYYY-MM-DD
      };
    }
    return null;
  }

  /**
   * Extract structured financial data from PDF text using Claude
   * @param {string} pdfText - Full text extracted from PDF
   * @param {string} fileName - Original filename
   * @returns {Promise<Object>} Extracted financial data
   */
  async extractFinancialData(pdfText, fileName) {
    if (!this.isServiceEnabled()) {
      throw new Error('Financial Extraction Service not enabled. ANTHROPIC_API_KEY required.');
    }

    try {
      // Extract date from filename
      const dateInfo = this.extractDateFromFilename(fileName);
      
      const extractionPrompt = `You are analyzing an HOA financial statement PDF. Extract all financial data and return it as a JSON object.

**Document Information:**
- Filename: ${fileName}
${dateInfo ? `- Statement Date: ${dateInfo.statementDate} (Month: ${dateInfo.month}, Year: ${dateInfo.year})` : ''}

**Extract the following data:**

1. **INCOME DATA** (from Income Statement):
   - Assessment income by community/road (both month-to-date and year-to-date)
   - Interest income (month and YTD)
   - Late fees (month and YTD)
   - Violation fines (month and YTD)
   - Total income (month and YTD)

2. **EXPENSE DATA** (from Income Statement):
   - General/Admin expenses (month and YTD)
   - Maintenance expenses (month and YTD)
   - Reserve expenses by community (month and YTD)
   - Total expenses (month and YTD)

3. **BALANCE SHEET DATA**:
   - Total cash
   - Accounts receivable
   - Fund balances by category

4. **CALCULATIONS**:
   - Net income (Income - Expenses) for month and YTD
   - Assessment collection rate if available

**Return ONLY valid JSON in this structure:**
{
  "income": {
    "assessments": {
      "monthTotal": 0,
      "ytdTotal": 0,
      "byCommunity": {}
    },
    "interestIncome": { "month": 0, "ytd": 0 },
    "lateFees": { "month": 0, "ytd": 0 },
    "violationFines": { "month": 0, "ytd": 0 },
    "total": { "month": 0, "ytd": 0 }
  },
  "expenses": {
    "generalAdmin": { "month": 0, "ytd": 0, "categories": {} },
    "maintenance": { "month": 0, "ytd": 0, "categories": {} },
    "reserve": { "month": 0, "ytd": 0, "byCommunity": {} },
    "total": { "month": 0, "ytd": 0 }
  },
  "balanceSheet": {
    "totalCash": 0,
    "accountsReceivable": 0,
    "fundBalances": {}
  },
  "calculations": {
    "netIncome": { "month": 0, "ytd": 0 },
    "collectionRate": null
  }
}

**PDF Text:**
${pdfText.substring(0, 100000)} ${pdfText.length > 100000 ? '\n\n[... text truncated ...]' : ''}

Return ONLY the JSON object, no other text.`;

      const modelName = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
      
      const response = await this.client.messages.create({
        model: modelName,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: extractionPrompt
        }]
      });

      // Extract JSON from response
      const responseText = response.content[0].text;
      
      // Try to extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const extractedData = JSON.parse(jsonText);

      // Add date info if extracted from filename
      if (dateInfo) {
        extractedData.statementDate = dateInfo.statementDate;
        extractedData.statementMonth = dateInfo.month;
        extractedData.statementYear = dateInfo.year;
      }

      logger.info('Financial data extracted successfully', 'FinancialExtractionService', {
        fileName,
        hasIncome: !!extractedData.income,
        hasExpenses: !!extractedData.expenses
      });

      return extractedData;
    } catch (error) {
      logger.error('Error extracting financial data', 'FinancialExtractionService', {
        fileName,
        errorMessage: error.message
      }, error);
      throw new Error(`Failed to extract financial data: ${error.message}`);
    }
  }

  /**
   * Save extracted financial data to database
   * @param {string} communityId - Community ID
   * @param {string} fileId - Source PDF file ID
   * @param {Object} extractedData - Extracted financial data
   * @returns {Promise<Object>} Saved financial data record
   */
  async saveFinancialData(communityId, fileId, extractedData) {
    try {
      const pool = await getConnection();

      // Calculate aggregated totals
      const totalIncome = extractedData.income?.total?.month || 0;
      const totalExpenses = extractedData.expenses?.total?.month || 0;
      const netIncome = totalIncome - totalExpenses;
      const ytdIncome = extractedData.income?.total?.ytd || 0;
      const ytdExpenses = extractedData.expenses?.total?.ytd || 0;
      const ytdNetIncome = ytdIncome - ytdExpenses;

      // Calculate collection rate if assessment data available
      let collectionRate = null;
      if (extractedData.income?.assessments) {
        const assessmentsBilled = extractedData.income.assessments.ytdTotal || 0;
        // Note: Collection data might be in balance sheet or separate section
        // For now, we'll calculate if we have the data
        if (extractedData.calculations?.collectionRate !== null) {
          collectionRate = extractedData.calculations.collectionRate;
        }
      }

      // Check if record already exists (same community, year, month)
      // Create a new request for this query
      const checkRequest = pool.request();
      const checkResult = await checkRequest
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .input('StatementYear', sql.Int, extractedData.statementYear)
        .input('StatementMonth', sql.Int, extractedData.statementMonth)
        .query(`
          SELECT FinancialDataID
          FROM cor_FinancialData
          WHERE CommunityID = @CommunityID
            AND StatementYear = @StatementYear
            AND StatementMonth = @StatementMonth
            AND IsActive = 1
        `);

      const existingRecord = checkResult.recordset[0];

      // Prepare JSON data
      const incomeDataJson = JSON.stringify(extractedData.income || {});
      const expenseDataJson = JSON.stringify(extractedData.expenses || {});
      const balanceSheetJson = JSON.stringify(extractedData.balanceSheet || {});

      if (existingRecord) {
        // Update existing record - create a new request
        const updateRequest = pool.request();
        await updateRequest
          .input('FinancialDataID', sql.UniqueIdentifier, existingRecord.FinancialDataID)
          .input('FileID', sql.UniqueIdentifier, fileId)
          .input('StatementDate', sql.Date, extractedData.statementDate)
          .input('IncomeData', sql.NVarChar(sql.MAX), incomeDataJson)
          .input('ExpenseData', sql.NVarChar(sql.MAX), expenseDataJson)
          .input('BalanceSheetData', sql.NVarChar(sql.MAX), balanceSheetJson)
          .input('TotalIncome', sql.Decimal(12, 2), totalIncome)
          .input('TotalExpenses', sql.Decimal(12, 2), totalExpenses)
          .input('NetIncome', sql.Decimal(12, 2), netIncome)
          .input('YTDIncome', sql.Decimal(12, 2), ytdIncome)
          .input('YTDExpenses', sql.Decimal(12, 2), ytdExpenses)
          .input('YTDNetIncome', sql.Decimal(12, 2), ytdNetIncome)
          .input('AssessmentIncome', sql.Decimal(12, 2), extractedData.income?.assessments?.ytdTotal || null)
          .input('CollectionRate', sql.Decimal(5, 4), collectionRate)
          .input('ExtractionVersion', sql.Int, 1)
          .query(`
            UPDATE cor_FinancialData
            SET FileID = @FileID,
                StatementDate = @StatementDate,
                IncomeData = @IncomeData,
                ExpenseData = @ExpenseData,
                BalanceSheetData = @BalanceSheetData,
                TotalIncome = @TotalIncome,
                TotalExpenses = @TotalExpenses,
                NetIncome = @NetIncome,
                YTDIncome = @YTDIncome,
                YTDExpenses = @YTDExpenses,
                YTDNetIncome = @YTDNetIncome,
                AssessmentIncome = @AssessmentIncome,
                CollectionRate = @CollectionRate,
                ExtractionVersion = @ExtractionVersion,
                ExtractedOn = SYSUTCDATETIME(),
                ExtractionError = NULL,
                ModifiedOn = SYSUTCDATETIME()
            WHERE FinancialDataID = @FinancialDataID
          `);

        logger.info('Updated existing financial data record', 'FinancialExtractionService', {
          financialDataId: existingRecord.FinancialDataID,
          communityId,
          year: extractedData.statementYear,
          month: extractedData.statementMonth
        });

        return existingRecord.FinancialDataID;
      } else {
        // Insert new record - create a new request
        const insertRequest = pool.request();
        const result = await insertRequest
          .input('CommunityID', sql.UniqueIdentifier, communityId)
          .input('FileID', sql.UniqueIdentifier, fileId)
          .input('StatementDate', sql.Date, extractedData.statementDate)
          .input('StatementMonth', sql.Int, extractedData.statementMonth)
          .input('StatementYear', sql.Int, extractedData.statementYear)
          .input('IncomeData', sql.NVarChar(sql.MAX), incomeDataJson)
          .input('ExpenseData', sql.NVarChar(sql.MAX), expenseDataJson)
          .input('BalanceSheetData', sql.NVarChar(sql.MAX), balanceSheetJson)
          .input('TotalIncome', sql.Decimal(12, 2), totalIncome)
          .input('TotalExpenses', sql.Decimal(12, 2), totalExpenses)
          .input('NetIncome', sql.Decimal(12, 2), netIncome)
          .input('YTDIncome', sql.Decimal(12, 2), ytdIncome)
          .input('YTDExpenses', sql.Decimal(12, 2), ytdExpenses)
          .input('YTDNetIncome', sql.Decimal(12, 2), ytdNetIncome)
          .input('AssessmentIncome', sql.Decimal(12, 2), extractedData.income?.assessments?.ytdTotal || null)
          .input('CollectionRate', sql.Decimal(5, 4), collectionRate)
          .input('ExtractionVersion', sql.Int, 1)
          .query(`
            INSERT INTO cor_FinancialData (
              CommunityID, FileID, StatementDate, StatementMonth, StatementYear,
              IncomeData, ExpenseData, BalanceSheetData,
              TotalIncome, TotalExpenses, NetIncome,
              YTDIncome, YTDExpenses, YTDNetIncome,
              AssessmentIncome, CollectionRate,
              ExtractionVersion
            )
            OUTPUT INSERTED.FinancialDataID
            VALUES (
              @CommunityID, @FileID, @StatementDate, @StatementMonth, @StatementYear,
              @IncomeData, @ExpenseData, @BalanceSheetData,
              @TotalIncome, @TotalExpenses, @NetIncome,
              @YTDIncome, @YTDExpenses, @YTDNetIncome,
              @AssessmentIncome, @CollectionRate,
              @ExtractionVersion
            )
          `);

        const financialDataId = result.recordset[0].FinancialDataID;

        logger.info('Saved financial data to database', 'FinancialExtractionService', {
          financialDataId,
          communityId,
          year: extractedData.statementYear,
          month: extractedData.statementMonth
        });

        return financialDataId;
      }
    } catch (error) {
      logger.error('Error saving financial data', 'FinancialExtractionService', {
        communityId,
        fileId,
        errorMessage: error.message
      }, error);
      throw error;
    }
  }

  /**
   * Check if a file is a financial statement based on filename
   * @param {string} fileName - File name
   * @returns {boolean} True if appears to be a financial statement
   */
  isFinancialStatement(fileName) {
    const lowerName = fileName.toLowerCase();
    return lowerName.includes('financial') || 
           lowerName.includes('statement') ||
           lowerName.match(/\d{6}.*financial/i) !== null; // Pattern like "202510-Financial"
  }
}

module.exports = new FinancialExtractionService();

