import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
import type { InvoiceFeeData, CreateInvoiceData, InvoiceCharge } from '../../types';
import Modal from '../Modal/Modal';

interface InvoiceProps {
  onBack?: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ onBack }) => {
  const { selectedCommunity } = useCommunity();
  const [feeData, setFeeData] = useState<InvoiceFeeData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPDF, setIsCreatingPDF] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load fee data and invoice number on mount
  useEffect(() => {
    if (!selectedCommunity) {
      setError('Please select a community first');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fees, nextNumber] = await Promise.all([
          dataService.getFeesForCommunity(selectedCommunity.id),
          dataService.getNextInvoiceNumber()
        ]);
        setFeeData(fees);
        setInvoiceNumber(nextNumber);
      } catch (err) {
        logger.error('Error loading invoice data', 'Invoice', {}, err as Error);
        setError('Failed to load invoice data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCommunity]);

  const handlePreview = () => {
    if (!feeData || feeData.allCharges.length === 0) {
      setError('No charges available to preview');
      return;
    }
    setShowPreview(true);
  };

  const handleCreatePDF = async () => {
    if (!selectedCommunity || !feeData || feeData.allCharges.length === 0) {
      setError('Cannot create PDF: No charges available');
      return;
    }

    setIsCreatingPDF(true);
    setError(null);

    try {
      // Generate PDF
      const pdfResult = await dataService.generateInvoicePDF(
        selectedCommunity.id,
        invoiceNumber,
        invoiceDate,
        feeData.allCharges.map(charge => ({
          Description: charge.description,
          Amount: charge.amount
        })),
        feeData.total
      );

      logger.info('Invoice PDF created successfully', 'Invoice', { fileId: pdfResult.fileId });
      
      // Show success message
      alert(`Invoice PDF created successfully!\nFile: ${pdfResult.fileName}\nSaved to Invoices folder.`);
    } catch (err) {
      logger.error('Error creating invoice PDF', 'Invoice', {}, err as Error);
      setError('Failed to create PDF. Please try again.');
    } finally {
      setIsCreatingPDF(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCommunity || !feeData || feeData.allCharges.length === 0) {
      setError('Cannot generate invoice: No charges available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Create invoice data
      const invoiceData: CreateInvoiceData = {
        CommunityID: selectedCommunity.id,
        InvoiceDate: invoiceDate,
        Charges: feeData.allCharges.map((charge, index) => ({
          Description: charge.description,
          Amount: charge.amount,
          DisplayOrder: charge.displayOrder || index
        }))
      };

      // Create invoice
      const invoice = await dataService.createInvoice(invoiceData);

      // TODO: Generate PDF and upload to file storage, then link to invoice
      // For now, just show success message
      logger.info('Invoice created successfully', 'Invoice', { invoiceId: invoice.id });
      
      // Show success and close
      alert(`Invoice ${invoice.invoiceNumber} created successfully! PDF generation will be implemented next.`);
      
      if (onBack) {
        onBack();
      }
    } catch (err) {
      logger.error('Error generating invoice', 'Invoice', {}, err as Error);
      setError('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!selectedCommunity) {
    return (
      <div className="h-full flex items-center justify-center bg-surface theme-transition">
        <div className="text-center">
          <p className="text-lg text-secondary">Please select a community to generate an invoice</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface theme-transition">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 mx-auto mb-4"></div>
          <p className="text-lg text-secondary">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  if (error && !feeData) {
    return (
      <div className="h-full flex items-center justify-center bg-surface theme-transition">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface theme-transition">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-primary p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Generate Invoice</h1>
            <p className="text-sm text-secondary mt-1">
              {selectedCommunity.displayName || selectedCommunity.legalName || 'Community'}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-secondary hover:text-primary transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="overflow-y-auto p-6" style={{ height: 'calc(100vh - 300px)' }}>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Invoice Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-primary"
              />
            </div>
          </div>
        </div>

        {/* Charges Summary */}
        {feeData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">Charges</h2>
              <span className="text-sm text-secondary">
                {feeData.allCharges.length} line item{feeData.allCharges.length !== 1 ? 's' : ''}
              </span>
            </div>

            {feeData.allCharges.length === 0 ? (
              <p className="text-secondary text-center py-8">No charges available for this community</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-secondary">
                  <div className="col-span-8">Description</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>
                {feeData.allCharges.map((charge, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <div className="col-span-8 text-primary">{charge.description}</div>
                    <div className="col-span-4 text-right font-medium text-primary">
                      {formatCurrency(charge.amount)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 py-4 border-t-2 border-gray-300 dark:border-gray-600 mt-4">
                  <div className="col-span-8 text-lg font-semibold text-primary">Total</div>
                  <div className="col-span-4 text-right text-lg font-bold text-primary">
                    {formatCurrency(feeData.total)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions - Fixed at bottom of scrollable area */}
        <div className="flex gap-4 justify-end pt-6 pb-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <button
            onClick={handlePreview}
            disabled={!feeData || feeData.allCharges.length === 0}
            className="px-6 py-2 border border-royal-600 text-royal-600 rounded-lg hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>
          <button
            onClick={handleCreatePDF}
            disabled={!feeData || feeData.allCharges.length === 0 || isCreatingPDF}
            className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingPDF ? 'Creating PDF...' : 'Create PDF'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={!feeData || feeData.allCharges.length === 0 || isGenerating}
            className="px-6 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && feeData && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={`Invoice Preview - ${invoiceNumber}`}
          maxWidth="max-w-4xl"
        >
          <div className="p-6">
            {/* Invoice Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {selectedCommunity.displayName || selectedCommunity.legalName}
                  </h2>
                  {selectedCommunity.addressLine1 && (
                    <p className="text-sm text-secondary">
                      {selectedCommunity.addressLine1}
                      {selectedCommunity.addressLine2 && `, ${selectedCommunity.addressLine2}`}
                      {selectedCommunity.city && `, ${selectedCommunity.city}`}
                      {selectedCommunity.state && ` ${selectedCommunity.state}`}
                      {selectedCommunity.postalCode && ` ${selectedCommunity.postalCode}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary mb-1">Invoice Number</p>
                  <p className="font-semibold text-primary">{invoiceNumber}</p>
                  <p className="text-sm text-secondary mt-2 mb-1">Invoice Date</p>
                  <p className="text-primary">{new Date(invoiceDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Charges Table */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-secondary">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.allCharges.map((charge, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4 text-primary">{charge.description}</td>
                      <td className="py-3 px-4 text-right font-medium text-primary">
                        {formatCurrency(charge.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                    <td className="py-4 px-4 text-lg font-semibold text-primary">Total</td>
                    <td className="py-4 px-4 text-right text-lg font-bold text-primary">
                      {formatCurrency(feeData.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-secondary mt-8">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Invoice;

