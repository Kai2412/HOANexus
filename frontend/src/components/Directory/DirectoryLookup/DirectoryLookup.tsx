import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import type { Stakeholder } from '../../../types/stakeholder';
import { STAKEHOLDER_TYPES, STAKEHOLDER_STATUSES } from '../../../types/stakeholder';
import { stakeholderService } from '../../../services/stakeholderService';
import ConfirmationModal from '../../Modal/ConfirmationModal';
import ViewStakeholderModal from '../ViewStakeholderModal';
import EditStakeholderModal from '../EditStakeholderModal';

interface DirectoryLookupProps {
  stakeholders: Stakeholder[];
  filteredStakeholders: Stakeholder[];
  loading: boolean;
  error: string | null;
  onEditStakeholder?: (stakeholder: Stakeholder) => void;
  onViewStakeholder?: (stakeholder: Stakeholder) => void;
  onDeleteStakeholder?: (id: number) => void;
}

const DirectoryLookup: React.FC<DirectoryLookupProps> = ({ 
  stakeholders,
  filteredStakeholders,
  loading,
  error,
  onEditStakeholder, 
  onViewStakeholder,
  onDeleteStakeholder
}) => {
  const [expandedStakeholder, setExpandedStakeholder] = useState<number | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [stakeholderToDelete, setStakeholderToDelete] = useState<number | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);


  const handleDeleteClick = (id: number) => {
    setStakeholderToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stakeholderToDelete) return;
    
    setDeleteLoading(true);
    try {
      if (onDeleteStakeholder) {
        await onDeleteStakeholder(stakeholderToDelete);
      }
      setShowDeleteConfirmation(false);
      setStakeholderToDelete(null);
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
    setStakeholderToDelete(null);
  };

  const handleViewClick = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setShowViewModal(true);
  };

  const handleEditClick = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedStakeholder: Stakeholder) => {
    // Call the parent's onEditStakeholder if provided
    if (onEditStakeholder) {
      onEditStakeholder(updatedStakeholder);
    }
    
    // Update selectedStakeholder if it's the same stakeholder being edited
    if (selectedStakeholder && selectedStakeholder.ID === updatedStakeholder.ID) {
      setSelectedStakeholder(updatedStakeholder);
    }
    
    setShowEditModal(false);
  };

  const handleModalClose = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedStakeholder(null);
  };

  const toggleExpanded = (id: number) => {
    setExpandedStakeholder(expandedStakeholder === id ? null : id);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
    <div className="p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-600"></div>
          <span className="ml-2 text-secondary">Loading stakeholders...</span>
        </div>
      )}

      {/* Stakeholders List */}
      {!loading && (
        <div className="space-y-2">
          {filteredStakeholders.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-secondary" />
              <h3 className="mt-2 text-sm font-medium text-primary">No stakeholders found</h3>
              <p className="mt-1 text-sm text-secondary">
                {filteredStakeholders.length === 0 && stakeholders.length > 0
                  ? 'Try adjusting your search criteria.'
                  : 'No stakeholders have been added yet.'}
              </p>
            </div>
          ) : (
            filteredStakeholders.map((stakeholder) => (
              <div
                key={stakeholder.ID}
                className="bg-surface border border-primary rounded-lg hover:shadow-md transition-shadow theme-transition"
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleExpanded(stakeholder.ID)}
                        className="p-1 hover:bg-surface-secondary rounded transition-colors"
                      >
                        {expandedStakeholder === stakeholder.ID ? (
                          <ChevronDownIcon className="h-5 w-5 text-secondary" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-secondary" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-primary">
                            {stakeholder.FirstName} {stakeholder.LastName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(stakeholder.Type)}`}>
                            {stakeholder.Type}
                          </span>
                          {stakeholder.Status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stakeholder.Status)}`}>
                              {stakeholder.Status}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-secondary">
                          {stakeholder.CompanyName && (
                            <div className="flex items-center space-x-1">
                              <BuildingOfficeIcon className="h-4 w-4" />
                              <span>{stakeholder.CompanyName}</span>
                            </div>
                          )}
                          {stakeholder.Email && (
                            <div className="flex items-center space-x-1">
                              <EnvelopeIcon className="h-4 w-4" />
                              <span>{stakeholder.Email}</span>
                              <button
                                onClick={() => copyToClipboard(stakeholder.Email!, `email-${stakeholder.ID}`)}
                                className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                                title="Copy email to clipboard"
                              >
                                {copiedField === `email-${stakeholder.ID}` ? (
                                  <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                ) : (
                                  <ClipboardDocumentIcon className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {stakeholder.Phone && (
                            <div className="flex items-center space-x-1">
                              <PhoneIcon className="h-4 w-4" />
                              <span>{stakeholder.Phone}</span>
                              <button
                                onClick={() => copyToClipboard(stakeholder.Phone!, `phone-${stakeholder.ID}`)}
                                className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                                title="Copy phone to clipboard"
                              >
                                {copiedField === `phone-${stakeholder.ID}` ? (
                                  <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                ) : (
                                  <ClipboardDocumentIcon className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewClick(stakeholder)}
                        className="p-2 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(stakeholder)}
                        className="p-2 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                        title="Edit Stakeholder"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(stakeholder.ID)}
                        className="p-2 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-surface-secondary rounded transition-colors"
                        title="Delete Stakeholder"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStakeholder === stakeholder.ID && (
                  <div className="border-t border-primary px-4 py-3 bg-surface-secondary">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-primary">Mobile Phone:</span>
                        <div className="flex items-center justify-between">
                          <p className="text-secondary flex items-center">
                            {stakeholder.MobilePhone ? (
                              <>
                                <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
                                {stakeholder.MobilePhone}
                              </>
                            ) : (
                              'Not provided'
                            )}
                          </p>
                          {stakeholder.MobilePhone && (
                            <button
                              onClick={() => copyToClipboard(stakeholder.MobilePhone!, `mobile-${stakeholder.ID}`)}
                              className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                              title="Copy mobile phone to clipboard"
                            >
                              {copiedField === `mobile-${stakeholder.ID}` ? (
                                <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <ClipboardDocumentIcon className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-primary">Preferred Contact:</span>
                        <p className="text-secondary">{stakeholder.PreferredContactMethod || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-primary">Portal Access:</span>
                        <p className="text-secondary">
                          {stakeholder.PortalAccessEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-primary">Last Login:</span>
                        <p className="text-secondary">{formatDate(stakeholder.LastLoginDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-primary">Created:</span>
                        <p className="text-secondary">{formatDate(stakeholder.CreatedDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-primary">Active:</span>
                        <p className="text-secondary">
                          {stakeholder.IsActive ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Stakeholder"
        message="Are you sure you want to delete this stakeholder? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />

      <ViewStakeholderModal
        isOpen={showViewModal}
        onClose={handleModalClose}
        stakeholder={selectedStakeholder}
      />

      <EditStakeholderModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        stakeholder={selectedStakeholder}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default DirectoryLookup;
