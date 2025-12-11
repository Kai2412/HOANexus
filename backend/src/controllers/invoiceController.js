const Invoice = require('../models/invoice');
const InvoiceDataService = require('../services/invoiceDataService');
const InvoicePDFService = require('../services/invoicePdfService');
const Community = require('../models/community');
const { logger } = require('../utils/logger');

// Helper to check if string is a valid GUID
const isGuid = (str) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
};

/**
 * Get all invoices for a community
 */
const getInvoicesByCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const invoices = await Invoice.getByCommunity(communityId);

    res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: invoices,
      count: invoices.length
    });
  } catch (error) {
    logger.error('Error fetching invoices by community', 'InvoiceController', { communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: error.message
    });
  }
};

/**
 * Get invoice by ID with charges
 */
const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid invoice ID is required'
    });
  }

  try {
    const invoice = await Invoice.getById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Error fetching invoice by ID', 'InvoiceController', { id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice',
      error: error.message
    });
  }
};

/**
 * Get all fees for a community (for invoice generation)
 */
const getFeesForCommunity = async (req, res) => {
  const { communityId } = req.params;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  try {
    const feeData = await InvoiceDataService.getAllFeesForCommunity(communityId);

    res.status(200).json({
      success: true,
      message: 'Fee data retrieved successfully',
      data: feeData
    });
  } catch (error) {
    logger.error('Error fetching fees for community', 'InvoiceController', { communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fee data',
      error: error.message
    });
  }
};

/**
 * Get next invoice number
 */
const getNextInvoiceNumber = async (req, res) => {
  try {
    const invoiceNumber = await Invoice.getNextInvoiceNumber();

    res.status(200).json({
      success: true,
      message: 'Next invoice number retrieved successfully',
      data: { invoiceNumber }
    });
  } catch (error) {
    logger.error('Error getting next invoice number', 'InvoiceController', {}, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next invoice number',
      error: error.message
    });
  }
};

/**
 * Create a new invoice with charges
 */
const createInvoice = async (req, res) => {
  const { CommunityID, InvoiceDate, Charges, CreatedBy } = req.body;

  if (!isGuid(CommunityID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  if (!InvoiceDate) {
    return res.status(400).json({
      success: false,
      message: 'Invoice date is required'
    });
  }

  if (!Charges || !Array.isArray(Charges) || Charges.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one charge is required'
    });
  }

  try {
    // Get next invoice number
    const invoiceNumber = await Invoice.getNextInvoiceNumber();

    // Calculate total
    const total = Charges.reduce((sum, charge) => sum + parseFloat(charge.Amount || 0), 0);

    // Create invoice
    const invoiceId = require('crypto').randomUUID();
    const invoiceData = {
      InvoiceID: invoiceId,
      CommunityID,
      InvoiceNumber: invoiceNumber,
      InvoiceDate,
      Total: total,
      Status: 'Draft',
      CreatedBy
    };

    const invoice = await Invoice.create(invoiceData);

    // Add charges
    for (let i = 0; i < Charges.length; i++) {
      const charge = Charges[i];
      await Invoice.addCharge({
        InvoiceID: invoiceId,
        Description: charge.Description,
        Amount: charge.Amount,
        DisplayOrder: charge.DisplayOrder || i,
        CreatedBy
      });
    }

    // Get full invoice with charges
    const fullInvoice = await Invoice.getById(invoiceId);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: fullInvoice
    });
  } catch (error) {
    logger.error('Error creating invoice', 'InvoiceController', { CommunityID }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

/**
 * Update invoice status
 */
const updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { Status, ModifiedBy } = req.body;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid invoice ID is required'
    });
  }

  if (!Status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  try {
    const invoice = await Invoice.updateStatus(id, Status, ModifiedBy);

    res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Error updating invoice status', 'InvoiceController', { id, Status }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message
    });
  }
};

/**
 * Update invoice file link
 */
const updateInvoiceFileLink = async (req, res) => {
  const { id } = req.params;
  const { FileID } = req.body;

  if (!isGuid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Valid invoice ID is required'
    });
  }

  if (!isGuid(FileID)) {
    return res.status(400).json({
      success: false,
      message: 'Valid file ID is required'
    });
  }

  try {
    const invoice = await Invoice.updateFileLink(id, FileID);

    res.status(200).json({
      success: true,
      message: 'Invoice file link updated successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Error updating invoice file link', 'InvoiceController', { id, FileID }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice file link',
      error: error.message
    });
  }
};

/**
 * Generate PDF for invoice (without creating database records)
 */
const generateInvoicePDF = async (req, res) => {
  const { communityId } = req.params;
  const { invoiceNumber, invoiceDate, charges, total } = req.body;

  if (!isGuid(communityId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid community ID is required'
    });
  }

  if (!invoiceNumber || !invoiceDate || !charges || !Array.isArray(charges) || charges.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invoice number, date, and at least one charge are required'
    });
  }

  try {
    // Get community data
    const community = await Community.getById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Normalize charges data (handle both Description/Amount and description/amount)
    const normalizedCharges = charges.map(charge => ({
      description: charge.description || charge.Description || '',
      amount: parseFloat(charge.amount || charge.Amount || 0)
    }));

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      invoiceDate,
      charges: normalizedCharges,
      total: total || normalizedCharges.reduce((sum, c) => sum + c.amount, 0)
    };

    // Prepare community data for PDF (Community.getById returns database format)
    const communityData = {
      displayName: community.DisplayName || null,
      legalName: community.LegalName || null,
      addressLine1: community.Address || null,
      addressLine2: community.Address2 || null,
      city: community.City || null,
      state: community.State || null,
      postalCode: community.Zipcode || null
    };

    // Generate and save PDF
    const fileRecord = await InvoicePDFService.generateAndSaveInvoicePDF(
      invoiceData,
      communityData,
      communityId,
      req.user?.stakeholderId || null
    );

    res.status(200).json({
      success: true,
      message: 'Invoice PDF generated and saved successfully',
      data: {
        fileId: fileRecord.FileID,
        fileName: fileRecord.FileName,
        fileUrl: fileRecord.FilePath,
        fileSize: fileRecord.FileSize
      }
    });
  } catch (error) {
    logger.error('Error generating invoice PDF', 'InvoiceController', { communityId }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF',
      error: error.message
    });
  }
};

/**
 * Generate management fee invoices for all active communities
 */
const generateManagementFeeInvoices = async (req, res) => {
  const { invoiceDate } = req.body; // YYYY-MM-DD format
  const userId = req.user?.id || null;

  if (!invoiceDate) {
    return res.status(400).json({
      success: false,
      message: 'Invoice date is required'
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(invoiceDate)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  try {
    // Parse dates - parse YYYY-MM-DD as local date to avoid timezone issues
    const [yearStr, monthStr, dayStr] = invoiceDate.split('-');
    const year = yearStr;
    const month = monthStr; // Already in MM format
    
    // Get today's date in YYYY-MM-DD format (local date, no timezone conversion)
    const today = new Date();
    const runDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Get all active communities
    const communities = await Community.getAll();
    const activeCommunities = communities.filter(c => c.Active === true || c.Active === 1);

    if (activeCommunities.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active communities found',
        data: {
          generated: 0,
          total: 0
        }
      });
    }

    // Find or create folder structure: Invoices -> Management Fees -> Year -> Month
    // month is already in MM format (e.g., "12" for December)
    const monthFolder = await InvoicePDFService.findOrCreateManagementFeeFolderStructure(year, month);

    // Generate invoices for each community
    const results = [];
    const errors = [];

    for (const community of activeCommunities) {
      try {
        // Get fee data for this community
        const feeData = await InvoiceDataService.getAllFeesForCommunity(community.CommunityID);

        // Only generate invoice if there is a management fee
        if (!feeData.managementFees || feeData.managementFees.length === 0) {
          logger.info('Skipping community with no management fee', 'InvoiceController', {
            communityCode: community.PropertyCode,
            communityId: community.CommunityID
          });
          continue;
        }

        // Map community data to format expected by PDF service
        const communityDataForPDF = {
          propertyCode: community.PropertyCode,
          displayName: community.DisplayName,
          legalName: community.LegalName,
          addressLine1: community.Address,
          addressLine2: community.Address2,
          city: community.City,
          state: community.State,
          postalCode: community.Zipcode
        };

        // Generate and save PDF
        const fileRecord = await InvoicePDFService.generateAndSaveManagementFeeInvoice(
          communityDataForPDF,
          feeData,
          invoiceDate,
          runDate,
          monthFolder,
          community.CommunityID // Pass communityId to link invoice to community
        );

        results.push({
          communityId: community.CommunityID,
          communityCode: community.PropertyCode,
          communityName: community.DisplayName || community.LegalName,
          fileId: fileRecord.FileID,
          fileName: fileRecord.FileName
        });
      } catch (error) {
        logger.error('Error generating invoice for community', 'InvoiceController', {
          communityCode: community.PropertyCode,
          communityId: community.CommunityID,
          errorMessage: error.message,
          errorStack: error.stack
        }, error);
        errors.push({
          communityId: community.CommunityID,
          communityCode: community.PropertyCode,
          communityName: community.DisplayName || community.LegalName,
          error: error.message
        });
      }
    }

    logger.info('Management fee invoice generation completed', 'InvoiceController', {
      generated: results.length,
      total: activeCommunities.length,
      errors: errors.length
    });

    res.status(200).json({
      success: true,
      message: `Generated ${results.length} management fee invoices`,
      data: {
        generated: results.length,
        total: activeCommunities.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Error generating management fee invoices', 'InvoiceController', { invoiceDate }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate management fee invoices',
      error: error.message
    });
  }
};

module.exports = {
  getInvoicesByCommunity,
  getInvoiceById,
  getFeesForCommunity,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoiceStatus,
  updateInvoiceFileLink,
  generateInvoicePDF,
  generateManagementFeeInvoices
};

