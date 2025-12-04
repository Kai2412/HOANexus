import React, { useState } from 'react';
import { CogIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal/Modal';
import dataService from '../../services/dataService';
import logger from '../../services/logger';

const CorporateProcesses: React.FC = () => {
  const [showManagementFeeModal, setShowManagementFeeModal] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    // Default to today's date in YYYY-MM-DD format (local time, not UTC)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOpenManagementFeeModal = () => {
    setShowManagementFeeModal(true);
    setShowConfirmation(false);
  };

  const handleCloseModal = () => {
    if (!isGenerating) {
      setShowManagementFeeModal(false);
      setShowConfirmation(false);
      // Reset date to today (local time, not UTC)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setInvoiceDate(`${year}-${month}-${day}`);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceDate(e.target.value);
  };

  const handleProceedToConfirmation = () => {
    if (!invoiceDate) {
      alert('Please select an invoice date');
      return;
    }
    setShowConfirmation(true);
  };

  const handleGenerateInvoices = async () => {
    if (!invoiceDate) {
      alert('Please select an invoice date');
      return;
    }

    setIsGenerating(true);
    try {
      await dataService.generateManagementFeeInvoices(invoiceDate);
      alert('Management fee invoices generated successfully!');
      handleCloseModal();
    } catch (error) {
      logger.error('Error generating management fee invoices', 'CorporateProcesses', { invoiceDate }, error as Error);
      alert('Failed to generate management fee invoices. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Corporate Processes</h2>
          <p className="text-secondary">
            Run automated processes for corporate-wide operations. These processes generate files and documents automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Management Fee Invoices Button */}
          <button
            onClick={handleOpenManagementFeeModal}
            className="flex flex-col items-center justify-center p-8 bg-surface border border-primary rounded-lg hover:border-royal-600 hover:shadow-lg transition-all group"
          >
            <div className="mb-4 p-4 bg-royal-600/10 rounded-full group-hover:bg-royal-600/20 transition-colors">
              <DocumentTextIcon className="w-12 h-12 text-royal-600" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Management Fee Invoices</h3>
            <p className="text-sm text-secondary text-center">
              Generate management fee invoices for all communities
            </p>
          </button>

          {/* Placeholder for future processes */}
          <div className="flex flex-col items-center justify-center p-8 bg-surface border border-primary rounded-lg opacity-50">
            <div className="mb-4 p-4 bg-gray-600/10 rounded-full">
              <CogIcon className="w-12 h-12 text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-tertiary mb-2">Coming Soon</h3>
            <p className="text-sm text-tertiary text-center">
              More automated processes will be available here
            </p>
          </div>
        </div>
      </div>

      {/* Management Fee Invoices Modal */}
      {showManagementFeeModal && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={showConfirmation ? 'Confirm Generation' : 'Management Fee Invoices'}
        >
          {!showConfirmation ? (
            <div className="space-y-4">
              <div>
                <p className="text-secondary mb-4">
                  This will generate management fee invoices for all active communities and save them to Corporate Files.
                </p>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-600"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-secondary mt-1">
                    Selected date: {formatDateForDisplay(invoiceDate)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCloseModal}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-surface-tertiary hover:bg-surface text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToConfirmation}
                  disabled={isGenerating || !invoiceDate}
                  className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-surface-tertiary border border-primary rounded-lg p-4">
                <h4 className="text-primary font-semibold mb-2">Ready to Generate</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Invoice Date:</span>
                    <span className="text-primary font-medium">{formatDateForDisplay(invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Process:</span>
                    <span className="text-primary font-medium">Management Fee Invoices</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Output Location:</span>
                    <span className="text-primary font-medium">Corporate Files / Invoices / Management Fees</span>
                  </div>
                </div>
              </div>
              <p className="text-secondary text-sm">
                This will generate invoices for all active communities. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-surface-tertiary hover:bg-surface text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateInvoices}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Invoices'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

export default CorporateProcesses;

