import React, { useState } from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  DevicePhoneMobileIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import type { Stakeholder } from '../../../types/stakeholder';
import logger from '../../../services/logger';

interface ViewStakeholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholder: Stakeholder | null;
}

const ViewStakeholderModal: React.FC<ViewStakeholderModalProps> = ({
  isOpen,
  onClose,
  stakeholder
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      logger.warn('Failed to copy to clipboard', 'ViewStakeholderModal', { field: fieldName }, err as Error);
    }
  };

  if (!isOpen || !stakeholder) return null;

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string | null): string => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'inactive': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'suspended': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Resident': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'Company Employee': return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200';
      case 'Vendor': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'Other': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-surface rounded-lg shadow-xl border border-primary max-w-4xl w-full max-h-[90vh] theme-transition">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-royal-100 dark:bg-royal-900 rounded-full">
                <UserIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Stakeholder Details</h3>
                <p className="text-sm text-secondary">View complete stakeholder information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-secondary hover:text-primary hover:bg-surface-secondary rounded transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-semibold text-primary mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-royal-600 dark:text-royal-400" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
                    <p className="text-primary font-medium">
                      {stakeholder.FirstName} {stakeholder.LastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Type</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(stakeholder.Type)}`}>
                      {stakeholder.Type}
                    </span>
                  </div>
                </div>
                
                {/* SubType and AccessLevel Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {stakeholder.SubType && (
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Sub Type</label>
                      <p className="text-primary">{stakeholder.SubType}</p>
                    </div>
                  )}
                  {stakeholder.AccessLevel && (
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Access Level</label>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-royal-100 dark:bg-royal-900 text-royal-800 dark:text-royal-200">
                        {stakeholder.AccessLevel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Community Information */}
                {stakeholder.CommunityID && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary mb-1">Community</label>
                    <p className="text-primary">Community ID: {stakeholder.CommunityID}</p>
                  </div>
                )}
              </div>

              {/* Company Information */}
              {stakeholder.CompanyName && (
                <div>
                  <h4 className="text-md font-semibold text-primary mb-4 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-royal-600 dark:text-royal-400" />
                    Company Information
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Company Name</label>
                    <p className="text-primary">{stakeholder.CompanyName}</p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="text-md font-semibold text-primary mb-4 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-royal-600 dark:text-royal-400" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stakeholder.Email && (
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Email Address</label>
                      <div className="flex items-center justify-between">
                        <p className="text-primary flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-secondary" />
                          {stakeholder.Email}
                        </p>
                        <button
                          onClick={() => copyToClipboard(stakeholder.Email!, 'email')}
                          className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy email to clipboard"
                        >
                          {copiedField === 'email' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {stakeholder.Phone && (
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Phone Number</label>
                      <div className="flex items-center justify-between">
                        <p className="text-primary flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2 text-secondary" />
                          {stakeholder.Phone}
                        </p>
                        <button
                          onClick={() => copyToClipboard(stakeholder.Phone!, 'phone')}
                          className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy phone to clipboard"
                        >
                          {copiedField === 'phone' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {stakeholder.MobilePhone && (
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Mobile Phone</label>
                      <div className="flex items-center justify-between">
                        <p className="text-primary flex items-center">
                          <DevicePhoneMobileIcon className="h-4 w-4 mr-2 text-secondary" />
                          {stakeholder.MobilePhone}
                        </p>
                        <button
                          onClick={() => copyToClipboard(stakeholder.MobilePhone!, 'mobile')}
                          className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy mobile phone to clipboard"
                        >
                          {copiedField === 'mobile' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Preferred Contact Method</label>
                    <p className="text-primary">{stakeholder.PreferredContactMethod || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div>
                <h4 className="text-md font-semibold text-primary mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-royal-600 dark:text-royal-400" />
                  Additional Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stakeholder.Status)}`}>
                      {stakeholder.Status || 'Not Set'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Portal Access</label>
                    <div className="flex items-center">
                      {stakeholder.PortalAccessEnabled ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                      )}
                      <span className="text-primary">
                        {stakeholder.PortalAccessEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Last Login</label>
                    <p className="text-primary">{formatDate(stakeholder.LastLoginDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Created Date</label>
                    <p className="text-primary">{formatDate(stakeholder.CreatedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {stakeholder.Notes && (
                <div>
                  <h4 className="text-md font-semibold text-primary mb-4">Notes</h4>
                  <div className="bg-surface-secondary rounded-lg p-4">
                    <p className="text-secondary text-sm">{stakeholder.Notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-primary">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-surface-secondary transition-colors theme-transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStakeholderModal;
