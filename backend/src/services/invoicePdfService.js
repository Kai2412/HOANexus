const PDFService = require('./pdfService');
const storageService = require('./storageService');
const Folder = require('../models/folder');
const File = require('../models/file');
const path = require('path');
const { logger } = require('../utils/logger');
const { sql, getConnection } = require('../config/database');

/**
 * Invoice PDF Service
 * Handles PDF generation and file storage for invoices
 */
class InvoicePDFService {
  /**
   * Find or create the "Invoices" folder for a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Folder object
   */
  static async findOrCreateInvoicesFolder(communityId) {
    try {
      // First, try to find existing "Invoices" folder (Corporate folder)
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT TOP 1
            FolderID,
            CommunityID,
            ParentFolderID,
            FolderName,
            FolderPath,
            FolderType
          FROM cor_Folders
          WHERE FolderName = 'Invoices'
            AND FolderType = 'Corporate'
            AND CommunityID IS NULL
            AND ParentFolderID IS NULL
            AND IsActive = 1
        `);

      if (result.recordset.length > 0) {
        return result.recordset[0];
      }

      // Create "Invoices" folder if it doesn't exist (Corporate folder)
      const newFolder = await Folder.create({
        CommunityID: null, // Corporate folder
        ParentFolderID: null,
        FolderName: 'Invoices',
        FolderType: 'Corporate', // Corporate folder (appears in Corporate view)
        DisplayOrder: 0,
        CreatedBy: null
      });

      logger.info('Created Invoices folder', 'InvoicePDFService', { folderId: newFolder.FolderID });
      return newFolder;
    } catch (error) {
      logger.error('Error finding/creating Invoices folder', 'InvoicePDFService', { communityId }, error);
      throw error;
    }
  }

  /**
   * Generate invoice PDF and save to file storage
   * @param {Object} invoiceData - Invoice data (invoiceNumber, invoiceDate, charges, total)
   * @param {Object} communityData - Community information
   * @param {string} communityId - Community ID
   * @param {string} createdBy - User ID who created the PDF
   * @returns {Promise<Object>} File record from database
   */
  static async generateAndSaveInvoicePDF(invoiceData, communityData, communityId, createdBy = null) {
    try {
      // Initialize storage service
      await storageService.initialize();

      // Find or create Invoices folder
      const invoicesFolder = await this.findOrCreateInvoicesFolder(communityId);

      // Generate PDF (with logo for testing)
      // TODO: Move to environment variable after testing
      const logoPath = path.join(__dirname, '../../assets/GOODWIN_CO_LOGO_BLACK-01 1.png');
      const logoOptions = {
        logoPath,
        logoWidth: 150,
        logoHeight: null // Auto-calculate
      };
      
      const pdfBuffer = await PDFService.generateInvoicePDF(invoiceData, communityData, logoOptions);

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${invoiceData.invoiceNumber}_${timestamp}.pdf`;
      const fileNameStored = fileName;

      // Upload to blob storage (Corporate path, but linked to community in DB)
      const blobPath = `corporate/files/${invoicesFolder.FolderID}/${fileNameStored}`;
      const fileUrl = await storageService.uploadFile(pdfBuffer, blobPath, 'application/pdf');

      // Create file record in database
      // Note: FolderType is 'Global' but we want it to appear in Corporate view
      // So we set FolderType to 'Corporate' but keep CommunityID for linking
      const fileRecord = await File.create({
        FolderID: invoicesFolder.FolderID,
        CommunityID: communityId, // Link to community for AI search
        FolderType: 'Corporate', // Appears in Corporate file browser
        FileName: fileName,
        FileNameStored: fileNameStored,
        FilePath: fileUrl,
        FileSize: pdfBuffer.length,
        MimeType: 'application/pdf',
        FileType: 'invoice',
        CreatedBy: createdBy
      });

      logger.info('Invoice PDF generated and saved', 'InvoicePDFService', {
        invoiceNumber: invoiceData.invoiceNumber,
        fileId: fileRecord.FileID,
        fileUrl
      });

      return fileRecord;
    } catch (error) {
      logger.error('Error generating and saving invoice PDF', 'InvoicePDFService', { invoiceData }, error);
      throw error;
    }
  }

  /**
   * Find or create corporate folder structure: Invoices -> Management Fees -> Year -> Month
   * @param {string} year - Year (e.g., "2025")
   * @param {string} month - Month (e.g., "10" for October)
   * @returns {Promise<Object>} Month folder object
   */
  static async findOrCreateManagementFeeFolderStructure(year, month) {
    try {
      const pool = await getConnection();
      
      // Step 1: Find or create "Invoices" folder (Corporate)
      let invoicesFolder = await pool.request()
        .query(`
          SELECT TOP 1 FolderID, FolderName, FolderPath
          FROM cor_Folders
          WHERE FolderName = 'Invoices'
            AND FolderType = 'Corporate'
            AND CommunityID IS NULL
            AND ParentFolderID IS NULL
            AND IsActive = 1
        `);

      if (invoicesFolder.recordset.length === 0) {
        const newFolder = await Folder.create({
          CommunityID: null,
          ParentFolderID: null,
          FolderName: 'Invoices',
          FolderType: 'Corporate',
          DisplayOrder: 0,
          CreatedBy: null
        });
        invoicesFolder = { recordset: [newFolder] };
      }
      const invoicesFolderId = invoicesFolder.recordset[0].FolderID;

      // Step 2: Find or create "Management Fees" folder under Invoices
      let managementFeesFolder = await pool.request()
        .input('ParentFolderID', sql.UniqueIdentifier, invoicesFolderId)
        .query(`
          SELECT TOP 1 FolderID, FolderName, FolderPath
          FROM cor_Folders
          WHERE FolderName = 'Management Fees'
            AND FolderType = 'Corporate'
            AND CommunityID IS NULL
            AND ParentFolderID = @ParentFolderID
            AND IsActive = 1
        `);

      if (managementFeesFolder.recordset.length === 0) {
        const newFolder = await Folder.create({
          CommunityID: null,
          ParentFolderID: invoicesFolderId,
          FolderName: 'Management Fees',
          FolderType: 'Corporate',
          DisplayOrder: 0,
          CreatedBy: null
        });
        managementFeesFolder = { recordset: [newFolder] };
      }
      const managementFeesFolderId = managementFeesFolder.recordset[0].FolderID;

      // Step 3: Find or create Year folder under Management Fees
      let yearFolder = await pool.request()
        .input('ParentFolderID', sql.UniqueIdentifier, managementFeesFolderId)
        .input('Year', sql.NVarChar(10), year)
        .query(`
          SELECT TOP 1 FolderID, FolderName, FolderPath
          FROM cor_Folders
          WHERE FolderName = @Year
            AND FolderType = 'Corporate'
            AND CommunityID IS NULL
            AND ParentFolderID = @ParentFolderID
            AND IsActive = 1
        `);

      if (yearFolder.recordset.length === 0) {
        const newFolder = await Folder.create({
          CommunityID: null,
          ParentFolderID: managementFeesFolderId,
          FolderName: year,
          FolderType: 'Corporate',
          DisplayOrder: 0,
          CreatedBy: null
        });
        yearFolder = { recordset: [newFolder] };
      }
      const yearFolderId = yearFolder.recordset[0].FolderID;

      // Step 4: Find or create Month folder under Year
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[parseInt(month) - 1] || month;
      
      let monthFolder = await pool.request()
        .input('ParentFolderID', sql.UniqueIdentifier, yearFolderId)
        .input('MonthName', sql.NVarChar(20), monthName)
        .query(`
          SELECT TOP 1 FolderID, FolderName, FolderPath
          FROM cor_Folders
          WHERE FolderName = @MonthName
            AND FolderType = 'Corporate'
            AND CommunityID IS NULL
            AND ParentFolderID = @ParentFolderID
            AND IsActive = 1
        `);

      if (monthFolder.recordset.length === 0) {
        const newFolder = await Folder.create({
          CommunityID: null,
          ParentFolderID: yearFolderId,
          FolderName: monthName,
          FolderType: 'Corporate',
          DisplayOrder: parseInt(month),
          CreatedBy: null
        });
        monthFolder = { recordset: [newFolder] };
      }

      return monthFolder.recordset[0];
    } catch (error) {
      logger.error('Error finding/creating management fee folder structure', 'InvoicePDFService', { year, month }, error);
      throw error;
    }
  }

  /**
   * Generate and save management fee invoice PDF for a single community
   * @param {Object} communityData - Community information
   * @param {Object} feeData - Fee data from InvoiceDataService
   * @param {string} invoiceDate - Invoice date (YYYY-MM-DD)
   * @param {string} runDate - Date the process was run (YYYY-MM-DD)
   * @param {Object} monthFolder - Month folder object
   * @returns {Promise<Object>} File record from database
   */
  static async generateAndSaveManagementFeeInvoice(communityData, feeData, invoiceDate, runDate, monthFolder, communityId = null) {
    try {
      // Initialize storage service
      await storageService.initialize();

      // For management fee invoices, only use management fees (single line item)
      const managementFeeCharges = feeData.managementFees || [];
      
      // Skip if no management fee
      if (managementFeeCharges.length === 0) {
        throw new Error('No management fee found for this community');
      }

      // Calculate total from management fees only
      const managementFeeTotal = managementFeeCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);

      // Generate invoice number (simple format: CommunityCode + Date)
      const dateStr = invoiceDate.replace(/-/g, '');
      const invoiceNumber = `${communityData.propertyCode || 'COMM'}-MF-${dateStr}`;

      // Prepare invoice data - only management fee charges
      const invoiceData = {
        invoiceNumber,
        invoiceDate,
        charges: managementFeeCharges.map(charge => ({
          description: charge.description,
          amount: charge.amount
        })),
        total: managementFeeTotal
      };

      // Generate PDF (with logo for testing)
      // TODO: Move to environment variable after testing
      const logoPath = path.join(__dirname, '../../assets/GOODWIN_CO_LOGO_BLACK-01 1.png');
      const logoOptions = {
        logoPath,
        logoWidth: 150,
        logoHeight: null // Auto-calculate
      };
      
      const pdfBuffer = await PDFService.generateInvoicePDF(invoiceData, communityData, logoOptions);

      // Generate filename: "CommunityCode - Management Fee Invoice - RunDate - Timestamp"
      // Add timestamp to prevent overwrites if run multiple times on same day
      const runDateFormatted = runDate.replace(/-/g, '');
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].substring(8); // HHMMSS
      const fileName = `${communityData.propertyCode || 'COMM'} - Management Fee Invoice - ${runDateFormatted}-${timestamp}.pdf`;
      const fileNameStored = fileName;

      // Upload to blob storage (corporate path)
      const blobPath = `corporate/files/${monthFolder.FolderID}/${fileNameStored}`;
      
      logger.info('Uploading management fee invoice to blob storage', 'InvoicePDFService', {
        communityCode: communityData.propertyCode,
        blobPath,
        fileSize: pdfBuffer.length
      });
      
      let fileUrl;
      try {
        fileUrl = await storageService.uploadFile(pdfBuffer, blobPath, 'application/pdf');
        logger.info('File uploaded to blob storage successfully', 'InvoicePDFService', {
          communityCode: communityData.propertyCode,
          blobPath,
          fileUrl
        });
      } catch (uploadError) {
        logger.error('Failed to upload file to blob storage', 'InvoicePDFService', {
          communityCode: communityData.propertyCode,
          blobPath,
          error: uploadError.message
        }, uploadError);
        throw new Error(`Failed to upload invoice PDF to blob storage: ${uploadError.message}`);
      }

      // Create file record in database
      // Corporate file structure, but linked to community for AI search
      logger.info('Creating file record in database', 'InvoicePDFService', {
        communityCode: communityData.propertyCode,
        communityId: communityId,
        folderId: monthFolder.FolderID,
        fileName: fileName,
        fileUrl: fileUrl
      });
      
      const fileRecord = await File.create({
        FolderID: monthFolder.FolderID,
        CommunityID: communityId || null, // Link to community if available
        FolderType: 'Corporate', // Appears in Corporate file browser
        FileName: fileName,
        FileNameStored: fileNameStored,
        FilePath: fileUrl,
        FileSize: pdfBuffer.length,
        MimeType: 'application/pdf',
        FileType: 'invoice',
        CreatedBy: null
      });
      
      logger.info('File record created successfully', 'InvoicePDFService', {
        fileId: fileRecord.FileID,
        communityCode: communityData.propertyCode
      });

      logger.info('Management fee invoice PDF generated and saved', 'InvoicePDFService', {
        communityCode: communityData.propertyCode,
        invoiceNumber,
        fileId: fileRecord.FileID,
        blobPath,
        fileUrl
      });

      return fileRecord;
    } catch (error) {
      logger.error('Error generating and saving management fee invoice', 'InvoicePDFService', { 
        communityCode: communityData.propertyCode 
      }, error);
      throw error;
    }
  }
}

module.exports = InvoicePDFService;

