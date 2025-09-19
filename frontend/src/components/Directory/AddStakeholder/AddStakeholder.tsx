import React, { useState } from 'react';
import { 
  UserPlusIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { CreateStakeholderRequest } from '../../../types/stakeholder';
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

interface AddStakeholderProps {
  onSuccess?: (stakeholder: any) => void;
  onCancel?: () => void;
}

const AddStakeholder: React.FC<AddStakeholderProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateStakeholderRequest>({
    Type: 'Resident',
    SubType: '',
    AccessLevel: '',
    CommunityID: undefined,
    FirstName: '',
    LastName: '',
    CompanyName: '',
    Email: '',
    Phone: '',
    MobilePhone: '',
    PreferredContactMethod: 'Email',
    Status: 'Active',
    PortalAccessEnabled: false,
    Notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);

  const handleInputChange = (field: keyof CreateStakeholderRequest, value: string | boolean | number) => {
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

  // Load communities when component mounts
  React.useEffect(() => {
    loadCommunities();
  }, []);

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

  const validateForm = (): boolean => {
    if (!formData.FirstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.LastName.trim()) {
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
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean up the data - remove empty strings for optional fields
      const cleanedData: CreateStakeholderRequest = {
        Type: formData.Type,
        SubType: formData.SubType?.trim() || undefined,
        AccessLevel: formData.AccessLevel?.trim() || undefined,
        CommunityID: formData.CommunityID || undefined,
        FirstName: formData.FirstName.trim(),
        LastName: formData.LastName.trim(),
        CompanyName: formData.CompanyName?.trim() || undefined,
        Email: formData.Email?.trim() || undefined,
        Phone: formData.Phone?.trim() || undefined,
        MobilePhone: formData.MobilePhone?.trim() || undefined,
        PreferredContactMethod: formData.PreferredContactMethod,
        Status: formData.Status,
        PortalAccessEnabled: formData.PortalAccessEnabled,
        Notes: formData.Notes?.trim() || undefined
      };

      const response = await stakeholderService.createStakeholder(cleanedData);
      
      if (response.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(response.data);
        }
        // Reset form after successful creation
        setTimeout(() => {
          setFormData({
            Type: 'Resident',
            SubType: '',
            AccessLevel: '',
            CommunityID: undefined,
            FirstName: '',
            LastName: '',
            CompanyName: '',
            Email: '',
            Phone: '',
            MobilePhone: '',
            PreferredContactMethod: 'Email',
            Status: 'Active',
            PortalAccessEnabled: false,
            Notes: ''
          });
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.message || 'Failed to create stakeholder');
      }
    } catch (err: any) {
      console.error('Error creating stakeholder:', err);
      setError(err.response?.data?.message || 'Failed to create stakeholder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Reset form
      setFormData({
        Type: 'Resident',
        SubType: '',
        AccessLevel: '',
        CommunityID: undefined,
        FirstName: '',
        LastName: '',
        CompanyName: '',
        Email: '',
        Phone: '',
        MobilePhone: '',
        PreferredContactMethod: 'Email',
        Status: 'Active',
        PortalAccessEnabled: false,
        Notes: ''
      });
      setError(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UserPlusIcon className="h-8 w-8 text-royal-600 dark:text-royal-400" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Add New Stakeholder</h1>
            <p className="text-secondary">Create a new stakeholder in the community directory</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={handleCancel}
            className="p-2 text-secondary hover:text-primary hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5" />
          <span>Stakeholder created successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-secondary border border-primary rounded-lg p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.FirstName}
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
                  value={formData.LastName}
                  onChange={(e) => handleInputChange('LastName', e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Stakeholder Type, SubType, and AccessLevel Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Stakeholder Type *
              </label>
              <select
                value={formData.Type}
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
            <div>
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

          {/* Company Information */}
          {shouldShowCompanyInfo() && (
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">Company Information</h3>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.CompanyName}
                  onChange={(e) => handleInputChange('CompanyName', e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                  placeholder="Enter company name (optional)"
                />
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => handleInputChange('Email', e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                  placeholder="Enter email address (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.Phone}
                  onChange={(e) => handleInputChange('Phone', e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                  placeholder="Enter phone number (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  value={formData.MobilePhone}
                  onChange={(e) => handleInputChange('MobilePhone', e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                  placeholder="Enter mobile phone (optional)"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-primary mb-2">
                Preferred Contact Method
              </label>
              <select
                value={formData.PreferredContactMethod}
                onChange={(e) => handleInputChange('PreferredContactMethod', e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
              >
                {CONTACT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Settings */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Additional Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Status
                  </label>
                  <select
                    value={formData.Status}
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
                  value={formData.Notes}
                  onChange={(e) => handleInputChange('Notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                  placeholder="Enter any notes or additional information (optional)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-surface-secondary transition-colors theme-transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-royal-600 hover:bg-royal-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{loading ? 'Creating...' : 'Create Stakeholder'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStakeholder;
