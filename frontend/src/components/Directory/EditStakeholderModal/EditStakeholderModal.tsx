import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import type { Stakeholder, UpdateStakeholderRequest } from '../../../types/stakeholder';
import { 
  STAKEHOLDER_TYPES, 
  STAKEHOLDER_SUBTYPES,
  ACCESS_LEVELS,
  CONTACT_METHODS, 
  STAKEHOLDER_STATUSES 
} from '../../../types/stakeholder';
import { stakeholderService } from '../../../services/stakeholderService';
import dataService from '../../../services/dataService';
import type { Community } from '../../../types/community';

interface EditStakeholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholder: Stakeholder | null;
  onSuccess?: (updatedStakeholder: Stakeholder) => void;
}

const EditStakeholderModal: React.FC<EditStakeholderModalProps> = ({
  isOpen,
  onClose,
  stakeholder,
  onSuccess
}) => {
  const [formData, setFormData] = useState<UpdateStakeholderRequest>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);

  // Initialize form data when stakeholder changes
  useEffect(() => {
    if (stakeholder) {
      setFormData({
        Type: stakeholder.Type,
        SubType: stakeholder.SubType || '',
        AccessLevel: stakeholder.AccessLevel || '',
        CommunityID: stakeholder.CommunityID || undefined,
        FirstName: stakeholder.FirstName || '',
        LastName: stakeholder.LastName || '',
        CompanyName: stakeholder.CompanyName || '',
        Email: stakeholder.Email || '',
        Phone: stakeholder.Phone || '',
        MobilePhone: stakeholder.MobilePhone || '',
        PreferredContactMethod: stakeholder.PreferredContactMethod || 'Email',
        Status: stakeholder.Status || 'Active',
        PortalAccessEnabled: stakeholder.PortalAccessEnabled || false,
        Notes: stakeholder.Notes || ''
      });
    }
  }, [stakeholder]);

  // Update community search term when stakeholder or communities change
  useEffect(() => {
    if (stakeholder && communities.length > 0 && stakeholder.CommunityID) {
      const community = communities.find(c => c.id === stakeholder.CommunityID);
      if (community) {
        setCommunitySearchTerm(`${community.displayName} (${community.pcode})`);
      }
    }
  }, [stakeholder, communities]);

  const handleInputChange = (field: keyof UpdateStakeholderRequest, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleTypeChange = (newType: string) => {
    handleInputChange('Type', newType);
    // Reset SubType and AccessLevel when Type changes
    handleInputChange('SubType', '');
    handleInputChange('AccessLevel', '');
    
    // Auto-clear community if switching to a type that doesn't need it
    if (!shouldShowCommunitySelectorForType(newType)) {
      handleInputChange('CommunityID', undefined);
      setCommunitySearchTerm('');
    }
  };

  // Check if Community selector should be shown for a specific type
  const shouldShowCommunitySelectorForType = (type: string) => {
    return type === 'Resident';
  };

  // Get available SubTypes based on selected Type
  const getAvailableSubTypes = () => {
    return STAKEHOLDER_SUBTYPES[formData.Type as keyof typeof STAKEHOLDER_SUBTYPES] || [];
  };

  // Check if Access Level should be shown (only for Company Employees)
  const shouldShowAccessLevel = () => {
    return formData.Type === 'Company Employee';
  };

  // Check if Community selector should be shown (only for Residents)
  const shouldShowCommunitySelector = () => {
    return formData.Type === 'Resident';
  };

  // Check if Company Information should be shown (only for Vendor)
  const shouldShowCompanyInfo = () => {
    return formData.Type === 'Vendor';
  };

  // Load communities when modal opens
  useEffect(() => {
    if (isOpen && communities.length === 0) {
      loadCommunities();
    }
  }, [isOpen]);

  const loadCommunities = async () => {
    setCommunitiesLoading(true);
    try {
      const communitiesData = await dataService.getCommunities();
      setCommunities(communitiesData);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  // Filter communities based on search term
  const getFilteredCommunities = () => {
    if (!communitySearchTerm.trim()) return communities;
    return communities.filter(community => 
      community.displayName.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
      community.pcode.toLowerCase().includes(communitySearchTerm.toLowerCase())
    );
  };

  // Handle community selection
  const handleCommunitySelect = (community: Community) => {
    handleInputChange('CommunityID', community.id);
    setCommunitySearchTerm(`${community.displayName} (${community.pcode})`);
    setShowCommunityDropdown(false);
  };

  // Get selected community display text
  const getSelectedCommunityText = () => {
    if (!formData.CommunityID) return '';
    const community = communities.find(c => c.id === formData.CommunityID);
    return community ? `${community.displayName} (${community.pcode})` : '';
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

  const validateForm = (): boolean => {
    if (!formData.FirstName?.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.LastName?.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.Type) {
      setError('Stakeholder type is required');
      return false;
    }
    
    // Email validation if provided
    if (formData.Email && formData.Email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    // Phone validation if provided
    if (formData.Phone && formData.Phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,}$/;
      if (!phoneRegex.test(formData.Phone)) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    // Mobile phone validation if provided
    if (formData.MobilePhone && formData.MobilePhone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,}$/;
      if (!phoneRegex.test(formData.MobilePhone)) {
        setError('Please enter a valid mobile phone number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stakeholder || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean up the data - remove empty strings for optional fields
      const cleanedData: UpdateStakeholderRequest = {
        Type: formData.Type,
        SubType: formData.SubType || undefined,
        AccessLevel: formData.AccessLevel || undefined,
        CommunityID: formData.CommunityID,
        FirstName: formData.FirstName?.trim(),
        LastName: formData.LastName?.trim(),
        CompanyName: formData.CompanyName?.trim() || undefined,
        Email: formData.Email?.trim() || undefined,
        Phone: formData.Phone?.trim() || undefined,
        MobilePhone: formData.MobilePhone?.trim() || undefined,
        PreferredContactMethod: formData.PreferredContactMethod,
        Status: formData.Status,
        PortalAccessEnabled: formData.PortalAccessEnabled,
        Notes: formData.Notes?.trim() || undefined
      };

      const response = await stakeholderService.updateStakeholder(stakeholder.ID, cleanedData);
      
      if (response.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(response.data);
        }
        // Close modal after successful update
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(response.message || 'Failed to update stakeholder');
      }
    } catch (err: any) {
      console.error('Error updating stakeholder:', err);
      setError(err.response?.data?.message || 'Failed to update stakeholder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen || !stakeholder) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-surface rounded-lg shadow-xl border border-primary max-w-4xl w-full max-h-[90vh] theme-transition">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-royal-100 dark:bg-royal-900 rounded-full">
                <PencilIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Edit Stakeholder</h3>
                <p className="text-sm text-secondary">Update stakeholder information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-secondary hover:text-primary hover:bg-surface-secondary rounded transition-colors"
              disabled={loading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Stakeholder updated successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h4 className="text-md font-semibold text-primary mb-4">Basic Information</h4>
                
                {/* First Name and Last Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.FirstName || ''}
                      onChange={(e) => handleInputChange('FirstName', e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.LastName || ''}
                      onChange={(e) => handleInputChange('LastName', e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                {/* Stakeholder Type, SubType, and AccessLevel Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Stakeholder Type *
                    </label>
                    <select
                      value={formData.Type || ''}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      required
                    >
                      {STAKEHOLDER_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Sub Type
                    </label>
                    <select
                      value={formData.SubType || ''}
                      onChange={(e) => handleInputChange('SubType', e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                    >
                      <option value="">Select Sub Type</option>
                      {getAvailableSubTypes().map(subType => (
                        <option key={subType} value={subType}>{subType}</option>
                      ))}
                    </select>
                  </div>
                  {shouldShowAccessLevel() && (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        Access Level
                      </label>
                      <select
                        value={formData.AccessLevel || ''}
                        onChange={(e) => handleInputChange('AccessLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      >
                        <option value="">Select Access Level</option>
                        {ACCESS_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Community Selector Row */}
                {shouldShowCommunitySelector() && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Community *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={communitySearchTerm}
                        onChange={(e) => {
                          setCommunitySearchTerm(e.target.value);
                          setShowCommunityDropdown(true);
                        }}
                        onFocus={() => setShowCommunityDropdown(true)}
                        onBlur={() => {
                          // Delay hiding to allow click on dropdown items
                          setTimeout(() => setShowCommunityDropdown(false), 200);
                        }}
                        className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                        placeholder={communitiesLoading ? "Loading communities..." : "Search communities..."}
                        required
                        disabled={communitiesLoading}
                      />
                      
                      {/* Dropdown Arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Dropdown */}
                      {showCommunityDropdown && !communitiesLoading && (
                        <div className="absolute z-10 w-full mt-1 bg-surface border border-primary rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {getFilteredCommunities().length > 0 ? (
                            getFilteredCommunities().map(community => (
                              <div
                                key={community.id}
                                className="px-3 py-2 hover:bg-surface-secondary cursor-pointer text-primary"
                                onMouseDown={() => handleCommunitySelect(community)}
                              >
                                <div className="font-medium">{community.displayName}</div>
                                <div className="text-sm text-secondary">Pcode: {community.pcode}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-secondary">No communities found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {communitiesLoading && (
                      <p className="text-sm text-secondary mt-1">Loading communities...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Company Information */}
              {shouldShowCompanyInfo() && (
                <div>
                  <h4 className="text-md font-semibold text-primary mb-4">Company Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.CompanyName || ''}
                      onChange={(e) => handleInputChange('CompanyName', e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      placeholder="Enter company name (optional)"
                    />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="text-md font-semibold text-primary mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.Email || ''}
                        onChange={(e) => handleInputChange('Email', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                        placeholder="Enter email address (optional)"
                      />
                      {formData.Email && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.Email!, 'email')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy email to clipboard"
                        >
                          {copiedField === 'email' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.Phone || ''}
                        onChange={(e) => handleInputChange('Phone', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                        placeholder="Enter phone number (optional)"
                      />
                      {formData.Phone && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.Phone!, 'phone')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy phone to clipboard"
                        >
                          {copiedField === 'phone' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Mobile Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.MobilePhone || ''}
                        onChange={(e) => handleInputChange('MobilePhone', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                        placeholder="Enter mobile phone (optional)"
                      />
                      {formData.MobilePhone && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.MobilePhone!, 'mobile')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy mobile phone to clipboard"
                        >
                          {copiedField === 'mobile' ? (
                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Preferred Contact Method
                    </label>
                    <select
                      value={formData.PreferredContactMethod || ''}
                      onChange={(e) => handleInputChange('PreferredContactMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                    >
                      {CONTACT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div>
                <h4 className="text-md font-semibold text-primary mb-4">Additional Settings</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        Status
                      </label>
                      <select
                        value={formData.Status || ''}
                        onChange={(e) => handleInputChange('Status', e.target.value)}
                        className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      >
                        {STAKEHOLDER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        Enable Portal Access
                      </label>
                      <select
                        value={formData.PortalAccessEnabled ? 'Yes' : 'No'}
                        onChange={(e) => handleInputChange('PortalAccessEnabled', e.target.value === 'Yes')}
                        className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.Notes || ''}
                      onChange={(e) => handleInputChange('Notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                      placeholder="Enter any notes or additional information (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-primary">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-surface-secondary transition-colors theme-transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-royal-600 hover:bg-royal-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{loading ? 'Updating...' : 'Update Stakeholder'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStakeholderModal;
