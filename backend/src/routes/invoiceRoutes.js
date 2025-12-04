const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all fees for a community (for invoice generation)
router.get('/fees/community/:communityId', invoiceController.getFeesForCommunity);

// Get next invoice number
router.get('/next-number', invoiceController.getNextInvoiceNumber);

// Get all invoices for a community
router.get('/community/:communityId', invoiceController.getInvoicesByCommunity);

// Get invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Generate invoice PDF (without creating database records)
router.post('/generate-pdf/community/:communityId', invoiceController.generateInvoicePDF);

// Create new invoice
router.post('/', invoiceController.createInvoice);

// Update invoice status
router.put('/:id/status', invoiceController.updateInvoiceStatus);

// Update invoice file link
router.put('/:id/file', invoiceController.updateInvoiceFileLink);

// Generate management fee invoices for all communities
router.post('/generate-management-fees', invoiceController.generateManagementFeeInvoices);

module.exports = router;

