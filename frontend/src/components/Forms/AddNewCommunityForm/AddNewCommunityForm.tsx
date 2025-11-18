import React, { useState } from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { 
  FormTemplate, 
  FormSection, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormTextarea 
} from '../FormTemplate';
import { PlacesAutocomplete } from '../../PlacesAutocomplete';

interface AddNewCommunityFormProps {
  onSuccess?: (community: any) => void;
  onCancel?: () => void;
}

interface CommunityFormData {
  pcode: string;
  name: string;
  displayName: string;
  communityType: string;
  totalUnits: number;
  status: string;
  isSubAssociation: boolean;
  isMasterAssociation: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  website: string;
  phone: string;
  email: string;
  description: string;
}

const AddNewCommunityForm: React.FC<AddNewCommunityFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CommunityFormData>({
    pcode: '',
    name: '',
    displayName: '',
    communityType: '',
    totalUnits: 0,
    status: 'Active',
    isSubAssociation: false,
    isMasterAssociation: false,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    latitude: 0,
    longitude: 0,
    website: '',
    phone: '',
    email: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const communityTypeOptions = [
    { value: 'masterplanned', label: 'Master Planned' },
    { value: 'singlefamily', label: 'Single Family' },
    { value: 'townhome', label: 'Town Home' },
    { value: 'condominium', label: 'Condominium' },
    { value: 'mixeduse', label: 'Mixed Use' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Under Construction', label: 'Under Construction' },
    { value: 'Planned', label: 'Planned' }
  ];

  const handleInputChange = (field: keyof CommunityFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddressSelect = (address: any) => {
    setFormData(prev => ({
      ...prev,
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'USA',
      latitude: address.latitude || 0,
      longitude: address.longitude || 0
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pcode.trim()) {
      newErrors.pcode = 'Community code is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    }
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    if (!formData.communityType) {
      newErrors.communityType = 'Community type is required';
    }
    if (formData.totalUnits <= 0) {
      newErrors.totalUnits = 'Total units must be greater than 0';
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to create community
      console.log('Creating community:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSuccess) {
        onSuccess(formData);
      }
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormTemplate
      successMessage="Community created successfully!"
      onSubmit={handleSubmit}
      loading={loading}
      submitButtonText="Create Community"
      submitButtonIcon={<BuildingOfficeIcon className="h-5 w-5" />}
    >
      {/* Basic Information */}
      <FormSection title="Basic Information" description="Essential community details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Community Code" required error={errors.pcode}>
            <FormInput
              type="text"
              value={formData.pcode}
              onChange={(e) => handleInputChange('pcode', e.target.value)}
              placeholder="e.g., HHHM"
              className={errors.pcode ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label="Community Name" required error={errors.name}>
            <FormInput
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Heritage Hills"
              className={errors.name ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label="Display Name" required error={errors.displayName}>
            <FormInput
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="e.g., Heritage Hills"
              className={errors.displayName ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label="Community Type" required error={errors.communityType}>
            <FormSelect
              value={formData.communityType}
              onChange={(e) => handleInputChange('communityType', e.target.value)}
              options={communityTypeOptions}
              placeholder="Select community type"
              className={errors.communityType ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label="Total Units" required error={errors.totalUnits}>
            <FormInput
              type="number"
              value={formData.totalUnits}
              onChange={(e) => handleInputChange('totalUnits', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="1"
              className={errors.totalUnits ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label="Status" required>
            <FormSelect
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={statusOptions}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isSubAssociation"
              checked={formData.isSubAssociation}
              onChange={(e) => handleInputChange('isSubAssociation', e.target.checked)}
              className="h-4 w-4 text-royal-600 focus:ring-royal-500 border-gray-300 rounded"
            />
            <label htmlFor="isSubAssociation" className="text-sm font-medium text-primary">
              Sub Association
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isMasterAssociation"
              checked={formData.isMasterAssociation}
              onChange={(e) => handleInputChange('isMasterAssociation', e.target.checked)}
              className="h-4 w-4 text-royal-600 focus:ring-royal-500 border-gray-300 rounded"
            />
            <label htmlFor="isMasterAssociation" className="text-sm font-medium text-primary">
              Master Association
            </label>
          </div>
        </div>
      </FormSection>

      {/* Address Information */}
      <FormSection title="Address Information" description="Physical location details">
        <div className="space-y-6">
          <FormField label="Address" required error={errors.addressLine1}>
            <PlacesAutocomplete
              onAddressSelect={handleAddressSelect}
              placeholder="Enter community address"
              className={errors.addressLine1 ? 'border-red-500' : ''}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Address Line 2">
              <FormInput
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                placeholder="Suite, unit, etc."
              />
            </FormField>

            <FormField label="City" required error={errors.city}>
              <FormInput
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                className={errors.city ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField label="State" required error={errors.state}>
              <FormInput
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
                className={errors.state ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField label="Postal Code" required error={errors.postalCode}>
              <FormInput
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                placeholder="12345"
                className={errors.postalCode ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField label="Country">
              <FormInput
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Country"
              />
            </FormField>
          </div>
        </div>
      </FormSection>

      {/* Contact Information */}
      <FormSection title="Contact Information" description="Community contact details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Website">
            <FormInput
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </FormField>

          <FormField label="Phone">
            <FormInput
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </FormField>

          <FormField label="Email">
            <FormInput
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@example.com"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Additional Information */}
      <FormSection title="Additional Information" description="Optional community details">
        <FormField label="Description">
          <FormTextarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of the community..."
            rows={4}
          />
        </FormField>
      </FormSection>
    </FormTemplate>
  );
};

export default AddNewCommunityForm;
