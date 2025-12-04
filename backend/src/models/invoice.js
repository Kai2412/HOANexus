const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const Invoice = {
  /**
   * Get all invoices for a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Array>} Array of invoices
   */
  getByCommunity: async (communityId) => {
    const pool = await getConnection();
    try {
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            InvoiceID,
            CommunityID,
            InvoiceNumber,
            InvoiceDate,
            Total,
            Status,
            FileID,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Invoices
          WHERE CommunityID = @CommunityID
          ORDER BY InvoiceDate DESC, CreatedOn DESC
        `);
      
      return result.recordset;
    } catch (error) {
      logger.error('Error fetching invoices by community', 'Invoice', { communityId }, error);
      throw error;
    }
  },

  /**
   * Get invoice by ID with charges
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object|null>} Invoice object with charges or null
   */
  getById: async (invoiceId) => {
    const pool = await getConnection();
    try {
      // Get invoice
      const invoiceResult = await pool.request()
        .input('InvoiceID', sql.UniqueIdentifier, invoiceId)
        .query(`
          SELECT 
            InvoiceID,
            CommunityID,
            InvoiceNumber,
            InvoiceDate,
            Total,
            Status,
            FileID,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_Invoices
          WHERE InvoiceID = @InvoiceID
        `);
      
      if (invoiceResult.recordset.length === 0) {
        return null;
      }

      const invoice = invoiceResult.recordset[0];

      // Get charges
      const chargesResult = await pool.request()
        .input('InvoiceID', sql.UniqueIdentifier, invoiceId)
        .query(`
          SELECT 
            InvoiceChargeID,
            InvoiceID,
            Description,
            Amount,
            DisplayOrder,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM cor_InvoiceCharges
          WHERE InvoiceID = @InvoiceID
          ORDER BY DisplayOrder, CreatedOn
        `);

      invoice.Charges = chargesResult.recordset;
      return invoice;
    } catch (error) {
      logger.error('Error fetching invoice by ID', 'Invoice', { invoiceId }, error);
      throw error;
    }
  },

  /**
   * Get next invoice number (global sequential)
   * @returns {Promise<string>} Next invoice number (e.g., "INV-2025-0001")
   */
  getNextInvoiceNumber: async () => {
    const pool = await getConnection();
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;

      // Get the highest invoice number for this year
      const result = await pool.request()
        .query(`
          SELECT TOP 1 InvoiceNumber
          FROM cor_Invoices
          WHERE InvoiceNumber LIKE '${prefix}%'
          ORDER BY InvoiceNumber DESC
        `);

      let nextNumber = 1;
      if (result.recordset.length > 0) {
        const lastNumber = result.recordset[0].InvoiceNumber;
        const numberPart = lastNumber.replace(prefix, '');
        nextNumber = parseInt(numberPart, 10) + 1;
      }

      // Format with leading zeros (4 digits)
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      return `${prefix}${formattedNumber}`;
    } catch (error) {
      logger.error('Error getting next invoice number', 'Invoice', {}, error);
      throw error;
    }
  },

  /**
   * Create a new invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  create: async (invoiceData) => {
    const pool = await getConnection();
    try {
      const invoiceId = invoiceData.InvoiceID || require('crypto').randomUUID();
      const result = await pool.request()
        .input('InvoiceID', sql.UniqueIdentifier, invoiceId)
        .input('CommunityID', sql.UniqueIdentifier, invoiceData.CommunityID)
        .input('InvoiceNumber', sql.VarChar(50), invoiceData.InvoiceNumber)
        .input('InvoiceDate', sql.Date, invoiceData.InvoiceDate)
        .input('Total', sql.Decimal(12, 2), invoiceData.Total)
        .input('Status', sql.VarChar(50), invoiceData.Status || 'Draft')
        .input('FileID', invoiceData.FileID ? sql.UniqueIdentifier : sql.NVarChar(50), invoiceData.FileID || null)
        .input('CreatedBy', invoiceData.CreatedBy ? sql.UniqueIdentifier : sql.NVarChar(50), invoiceData.CreatedBy || null)
        .query(`
          INSERT INTO cor_Invoices (
            InvoiceID,
            CommunityID,
            InvoiceNumber,
            InvoiceDate,
            Total,
            Status,
            FileID,
            CreatedBy
          )
          VALUES (
            @InvoiceID,
            @CommunityID,
            @InvoiceNumber,
            @InvoiceDate,
            @Total,
            @Status,
            @FileID,
            @CreatedBy
          )
        `);

      return await Invoice.getById(invoiceId);
    } catch (error) {
      logger.error('Error creating invoice', 'Invoice', { invoiceData }, error);
      throw error;
    }
  },

  /**
   * Add charge to invoice
   * @param {Object} chargeData - Charge data
   * @returns {Promise<Object>} Created charge
   */
  addCharge: async (chargeData) => {
    const pool = await getConnection();
    try {
      const chargeId = chargeData.InvoiceChargeID || require('crypto').randomUUID();
      const result = await pool.request()
        .input('InvoiceChargeID', sql.UniqueIdentifier, chargeId)
        .input('InvoiceID', sql.UniqueIdentifier, chargeData.InvoiceID)
        .input('Description', sql.VarChar(200), chargeData.Description)
        .input('Amount', sql.Decimal(12, 2), chargeData.Amount)
        .input('DisplayOrder', sql.Int, chargeData.DisplayOrder || 0)
        .input('CreatedBy', chargeData.CreatedBy ? sql.UniqueIdentifier : sql.NVarChar(50), chargeData.CreatedBy || null)
        .query(`
          INSERT INTO cor_InvoiceCharges (
            InvoiceChargeID,
            InvoiceID,
            Description,
            Amount,
            DisplayOrder,
            CreatedBy
          )
          VALUES (
            @InvoiceChargeID,
            @InvoiceID,
            @Description,
            @Amount,
            @DisplayOrder,
            @CreatedBy
          )
        `);

      return result.recordset[0];
    } catch (error) {
      logger.error('Error adding charge to invoice', 'Invoice', { chargeData }, error);
      throw error;
    }
  },

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status
   * @param {string} modifiedBy - User ID
   * @returns {Promise<Object>} Updated invoice
   */
  updateStatus: async (invoiceId, status, modifiedBy) => {
    const pool = await getConnection();
    try {
      await pool.request()
        .input('InvoiceID', sql.UniqueIdentifier, invoiceId)
        .input('Status', sql.VarChar(50), status)
        .input('ModifiedBy', modifiedBy ? sql.UniqueIdentifier : sql.NVarChar(50), modifiedBy || null)
        .query(`
          UPDATE cor_Invoices
          SET Status = @Status,
              ModifiedOn = SYSUTCDATETIME(),
              ModifiedBy = @ModifiedBy
          WHERE InvoiceID = @InvoiceID
        `);

      return await Invoice.getById(invoiceId);
    } catch (error) {
      logger.error('Error updating invoice status', 'Invoice', { invoiceId, status }, error);
      throw error;
    }
  },

  /**
   * Update invoice file link
   * @param {string} invoiceId - Invoice ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} Updated invoice
   */
  updateFileLink: async (invoiceId, fileId) => {
    const pool = await getConnection();
    try {
      await pool.request()
        .input('InvoiceID', sql.UniqueIdentifier, invoiceId)
        .input('FileID', sql.UniqueIdentifier, fileId)
        .query(`
          UPDATE cor_Invoices
          SET FileID = @FileID,
              ModifiedOn = SYSUTCDATETIME()
          WHERE InvoiceID = @InvoiceID
        `);

      return await Invoice.getById(invoiceId);
    } catch (error) {
      logger.error('Error updating invoice file link', 'Invoice', { invoiceId, fileId }, error);
      throw error;
    }
  }
};

module.exports = Invoice;

