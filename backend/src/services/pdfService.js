const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * PDF Generation Service
 * Creates invoice PDFs with proper formatting
 */
class PDFService {
  /**
   * Generate invoice PDF
   * @param {Object} invoiceData - Invoice data
   * @param {Object} communityData - Community information
   * @param {Object} options - Optional settings (logoPath, logoWidth, logoHeight)
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generateInvoicePDF(invoiceData, communityData, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header - Two column layout
        const startY = 50;
        const leftMargin = 50;
        const rightMargin = 400;
        const rightWidth = 150;
        
        // Optional: Add logo if provided
        let logoY = startY;
        if (options.logoPath) {
          try {
            // Check if file exists synchronously (inside Promise constructor)
            if (fs.existsSync(options.logoPath)) {
              const logoWidth = options.logoWidth || 150; // Default 150px width
              const logoHeight = options.logoHeight || null; // Maintain aspect ratio if not specified
              
              // PDFKit can read the image directly from path
              // If height not specified, PDFKit will maintain aspect ratio
              if (logoHeight) {
                doc.image(options.logoPath, leftMargin, logoY, {
                  width: logoWidth,
                  height: logoHeight
                });
                logoY += logoHeight + 10;
              } else {
                // Let PDFKit maintain aspect ratio
                doc.image(options.logoPath, leftMargin, logoY, {
                  width: logoWidth
                });
                // Estimate height (PDFKit will scale proportionally)
                // For most logos, assume roughly square or 2:1 ratio
                logoY += logoWidth * 0.6 + 10; // Conservative estimate
              }
            }
          } catch (logoError) {
            logger.warn('Could not load logo image, continuing without logo', 'PDFService', {
              logoPath: options.logoPath,
              error: logoError.message
            });
            // Continue without logo if it fails to load
          }
        }
        
        // Left column: Invoice title and community info
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('INVOICE', leftMargin, logoY);
        
        let currentY = logoY + 28;
        doc.fontSize(10).font('Helvetica');
        if (communityData.displayName || communityData.legalName) {
          doc.font('Helvetica-Bold').text(communityData.displayName || communityData.legalName, leftMargin, currentY);
          doc.font('Helvetica');
          currentY += 13;
        }
        
        // Address
        const addressParts = [];
        if (communityData.addressLine1) addressParts.push(communityData.addressLine1);
        if (communityData.addressLine2) addressParts.push(communityData.addressLine2);
        if (communityData.city) {
          let cityLine = communityData.city;
          if (communityData.state) cityLine += `, ${communityData.state}`;
          if (communityData.postalCode) cityLine += ` ${communityData.postalCode}`;
          addressParts.push(cityLine);
        }
        
        addressParts.forEach(line => {
          if (line) {
            doc.fontSize(9).text(line, leftMargin, currentY);
            currentY += 11;
          }
        });

        // Right column: Invoice details
        doc.fontSize(9).font('Helvetica');
        let rightY = startY + 8;
        
        // Invoice Number
        doc.text('Invoice Number:', rightMargin, rightY, { width: rightWidth, align: 'right' });
        doc.font('Helvetica-Bold').text(invoiceData.invoiceNumber, rightMargin, rightY + 11, { width: rightWidth, align: 'right' });
        doc.font('Helvetica');
        rightY += 26;
        
        // Invoice Date
        const invoiceDate = new Date(invoiceData.invoiceDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text('Invoice Date:', rightMargin, rightY, { width: rightWidth, align: 'right' });
        doc.text(invoiceDate, rightMargin, rightY + 11, { width: rightWidth, align: 'right' });

        // Separator line - position after the taller of the two columns
        const separatorY = Math.max(currentY, rightY + 25) + 10;
        doc.moveTo(leftMargin, separatorY).lineTo(550, separatorY).stroke();
        
        // Reset Y position for content below
        doc.y = separatorY + 20;

        // Charges Table Header
        doc.fontSize(11).font('Helvetica-Bold');
        const headerY = doc.y;
        doc.text('Description', 50, headerY);
        doc.text('Amount', 450, headerY, { width: 100, align: 'right' });
        doc.y = headerY + 14; // Move down after header
        doc.moveDown(0.3);
        
        // Line under header
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Charges
        doc.fontSize(10).font('Helvetica');
        invoiceData.charges.forEach((charge, index) => {
          const startY = doc.y;
          
          // Description (wrap if needed)
          doc.text(charge.description, 50, startY, { width: 380, align: 'left' });
          
          // Amount
          const amountY = startY;
          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(charge.amount);
          doc.text(formattedAmount, 450, amountY, { width: 100, align: 'right' });
          
          // Move to next line (use the taller of description or amount)
          const descriptionHeight = doc.heightOfString(charge.description, { width: 380 });
          doc.y = Math.max(startY + descriptionHeight, amountY + 12) + 5;
          
          // Add separator line between items (except last)
          if (index < invoiceData.charges.length - 1) {
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.3);
          }
        });

        // Total Line
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total:', 50, doc.y);
        const totalFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(invoiceData.total);
        doc.text(totalFormatted, 450, doc.y, { width: 100, align: 'right' });

        // Finalize PDF
        doc.end();
      } catch (error) {
        logger.error('Error generating invoice PDF', 'PDFService', { invoiceData }, error);
        reject(error);
      }
    });
  }
}

module.exports = PDFService;

