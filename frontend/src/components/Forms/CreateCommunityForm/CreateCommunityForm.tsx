import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { 
  FormTemplate, 
  FormSection, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormTextarea 
} from '../FormTemplate';
import dataService from '../../../services/dataService';
import { useAuth } from '../../../context';
import type { UpdateCommunityData } from '../../../types/community';
import logger from '../../../services/logger';

interface CreateCommunityFormProps {
  onSuccess?: (community: any) => void;
  onCancel?: () => void;
}

interface CommunityFormData {
  PropertyCode: string;
  DisplayName: string;
  LegalName: string;
  ClientType: string;
  ServiceType: string;
  ManagementType: string;
  DevelopmentStage: string;
  CommunityStatus: string;
  BuiltOutUnits: string;
  Market: string;
  Office: string;
  PreferredContactInfo: string;
  Website: string;
  Address: string;
  Address2: string;
  City: string;
  State: string;
  Zipcode: string;
  TaxID: string;
  StateTaxID: string;
  SOSFileNumber: string;
  TaxReturnType: string;
  AcquisitionType: string;
  ContractStart: string;
  ContractEnd: string;
  Active: boolean;
  ThirdPartyIdentifier: string;
}

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<CommunityFormData>({
    PropertyCode: '',
    DisplayName: '',
    LegalName: '',
    ClientType: '',
    ServiceType: '',
    ManagementType: '',
    DevelopmentStage: '',
    CommunityStatus: '',
    BuiltOutUnits: '',
    Market: '',
    Office: '',
    PreferredContactInfo: '',
    Website: '',
    Address: '',
    Address2: '',
    City: '',
    State: '',
    Zipcode: '',
    TaxID: '',
    StateTaxID: '',
    SOSFileNumber: '',
    TaxReturnType: '',
    AcquisitionType: '',
    ContractStart: '',
    ContractEnd: '',
    Active: true,
    ThirdPartyIdentifier: ''
  });

  const [dropdownOptions, setDropdownOptions] = useState<Record<string, Array<{ value: string; label: string; isDefault?: boolean }>>>({});
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load dropdown options
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const groupIds = [
          'client-types',
          'service-types',
          'management-types',
          'development-stages',
          'acquisition-types',
          'status'
        ];
        
        const response = await dataService.getDynamicDropChoices(groupIds);
        
        const columnToGroupId: Record<string, string> = {
          'ClientType': 'client-types',
          'ServiceType': 'service-types',
          'ManagementType': 'management-types',
          'DevelopmentStage': 'development-stages',
          'AcquisitionType': 'acquisition-types',
          'CommunityStatus': 'status'
        };

        const options: Record<string, Array<{ value: string; label: string; isDefault?: boolean }>> = {};
        
        Object.entries(columnToGroupId).forEach(([column, groupId]) => {
          if (response[groupId]) {
            options[column] = response[groupId].map((choice) => ({
              value: choice.ChoiceValue,
              label: choice.ChoiceValue,
              isDefault: choice.IsDefault
            }));
            
            // Set default value if available
            const defaultChoice = response[groupId].find(c => c.IsDefault);
            if (defaultChoice && !formData[column as keyof CommunityFormData]) {
              setFormData(prev => ({
                ...prev,
                [column]: defaultChoice.ChoiceValue
              }));
            }
          }
        });
        
        setDropdownOptions(options);
      } catch (err) {
        logger.error('Failed to load dropdown options', 'CreateCommunityForm', undefined, err as Error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdowns();
  }, []);

  const handleInputChange = (field: keyof CommunityFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.DisplayName.trim()) return 'Display Name is required';
    if (!formData.ClientType) return 'Client Type is required';
    if (!formData.Address.trim()) return 'Address is required';
    if (!formData.City.trim()) return 'City is required';
    if (!formData.State.trim()) return 'State is required';
    if (!formData.Zipcode.trim()) return 'Postal Code is required';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Prepare data for API
      const communityData: UpdateCommunityData = {
        PropertyCode: formData.PropertyCode || null,
        DisplayName: formData.DisplayName,
        LegalName: formData.LegalName || null,
        ClientType: formData.ClientType || null,
        ServiceType: formData.ServiceType || null,
        ManagementType: formData.ManagementType || null,
        DevelopmentStage: formData.DevelopmentStage || null,
        CommunityStatus: formData.CommunityStatus || null,
        BuiltOutUnits: formData.BuiltOutUnits ? parseInt(formData.BuiltOutUnits) : null,
        Market: formData.Market || null,
        Office: formData.Office || null,
        PreferredContactInfo: formData.PreferredContactInfo || null,
        Website: formData.Website || null,
        Address: formData.Address || null,
        Address2: formData.Address2 || null,
        City: formData.City || null,
        State: formData.State || null,
        Zipcode: formData.Zipcode || null,
        TaxID: formData.TaxID || null,
        StateTaxID: formData.StateTaxID || null,
        SOSFileNumber: formData.SOSFileNumber || null,
        TaxReturnType: formData.TaxReturnType || null,
        AcquisitionType: formData.AcquisitionType || null,
        ContractStart: formData.ContractStart || null,
        ContractEnd: formData.ContractEnd || null,
        Active: formData.Active,
        ThirdPartyIdentifier: formData.ThirdPartyIdentifier || null
      };

      const newCommunity = await dataService.createCommunity(communityData);
      
      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(newCommunity);
        }, 1500);
      }
    } catch (err: any) {
      logger.error('Error creating community', 'CreateCommunityForm', undefined, err as Error);
      setError(err.response?.data?.message || err.message || 'Failed to create community. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Community Info', onClick: onCancel },
    { label: 'Forms', onClick: onCancel },
    { label: 'Create Community', isActive: true }
  ];

  return (
    <FormTemplate
      formTitle="Create New Community"
      formDescription="Fill out the information below to create a new community"
      onCancel={onCancel}
      breadcrumbs={breadcrumbs}
      showCommunityContext={false}
      onSubmit={handleSubmit}
      loading={submitting}
      submitButtonText="Create Community"
      submitButtonIcon={<BuildingOfficeIcon className="w-5 h-5" />}
      successMessage="Community created successfully!"
      showSuccess={success}
      showError={!!error}
      errorMessage={error || undefined}
    >
      {/* Basic Information */}
      <FormSection title="Basic Information" icon={<BuildingOfficeIcon className="w-5 h-5" />}>
        <FormField label="Community Code" required={false}>
          <FormInput
            type="text"
            value={formData.PropertyCode}
            onChange={(e) => handleInputChange('PropertyCode', e.target.value)}
            placeholder="Enter community code"
          />
        </FormField>

        <FormField label="Display Name" required>
          <FormInput
            type="text"
            value={formData.DisplayName}
            onChange={(e) => handleInputChange('DisplayName', e.target.value)}
            placeholder="Enter display name"
            required
          />
        </FormField>

        <FormField label="Legal Name" required={false}>
          <FormInput
            type="text"
            value={formData.LegalName}
            onChange={(e) => handleInputChange('LegalName', e.target.value)}
            placeholder="Enter legal name"
          />
        </FormField>

        <FormField label="Client Type" required>
          <FormSelect
            value={formData.ClientType}
            onChange={(e) => handleInputChange('ClientType', e.target.value)}
            options={dropdownOptions.ClientType || []}
            placeholder={loadingDropdowns ? 'Loading...' : 'Select Client Type'}
            required
            disabled={loadingDropdowns}
          />
        </FormField>

        <FormField label="Service Type" required={false}>
          <FormSelect
            value={formData.ServiceType}
            onChange={(e) => handleInputChange('ServiceType', e.target.value)}
            options={dropdownOptions.ServiceType || []}
            placeholder={loadingDropdowns ? 'Loading...' : 'Select Service Type'}
            disabled={loadingDropdowns}
          />
        </FormField>

        <FormField label="Management Type" required={false}>
          <FormSelect
            value={formData.ManagementType}
            onChange={(e) => handleInputChange('ManagementType', e.target.value)}
            options={dropdownOptions.ManagementType || []}
            placeholder={loadingDropdowns ? 'Loading...' : 'Select Management Type'}
            disabled={loadingDropdowns}
          />
        </FormField>

        <FormField label="Development Stage" required={false}>
          <FormSelect
            value={formData.DevelopmentStage}
            onChange={(e) => handleInputChange('DevelopmentStage', e.target.value)}
            options={dropdownOptions.DevelopmentStage || []}
            placeholder={loadingDropdowns ? 'Loading...' : 'Select Development Stage'}
            disabled={loadingDropdowns}
          />
        </FormField>

        <FormField label="Community Status" required={false}>
          <FormSelect
            value={formData.CommunityStatus}
            onChange={(e) => handleInputChange('CommunityStatus', e.target.value)}
            options={dropdownOptions.CommunityStatus || []}
            placeholder={loadingDropdowns ? 'Loading...' : 'Select Community Status'}
            disabled={loadingDropdowns}
          />
        </FormField>

        <FormField label="Built Out Units" required={false}>
          <FormInput
            type="number"
            value={formData.BuiltOutUnits}
            onChange={(e) => handleInputChange('BuiltOutUnits', e.target.value)}
            placeholder="Enter number of units"
          />
        </FormField>

        <FormField label="Market" required={false}>
          <FormInput
            type="text"
            value={formData.Market}
            onChange={(e) => handleInputChange('Market', e.target.value)}
            placeholder="Enter market name"
          />
        </FormField>

        <FormField label="Office" required={false}>
          <FormInput
            type="text"
            value={formData.Office}
            onChange={(e) => handleInputChange('Office', e.target.value)}
            placeholder="Enter office"
          />
        </FormField>

        <FormField label="Preferred Contact Info" required={false}>
          <FormInput
            type="text"
            value={formData.PreferredContactInfo}
            onChange={(e) => handleInputChange('PreferredContactInfo', e.target.value)}
            placeholder="Enter preferred contact info"
          />
        </FormField>

        <FormField label="Website" required={false}>
          <FormInput
            type="text"
            value={formData.Website}
            onChange={(e) => handleInputChange('Website', e.target.value)}
            placeholder="https://example.com"
          />
        </FormField>
      </FormSection>

      {/* Geographic Information */}
      <FormSection title="Geographic Information">
        <FormField label="Address Line 1" required>
          <FormInput
            type="text"
            value={formData.Address}
            onChange={(e) => handleInputChange('Address', e.target.value)}
            placeholder="Enter street address"
            required
          />
        </FormField>

        <FormField label="Address Line 2" required={false}>
          <FormInput
            type="text"
            value={formData.Address2}
            onChange={(e) => handleInputChange('Address2', e.target.value)}
            placeholder="Apartment, suite, etc. (optional)"
          />
        </FormField>

        <FormField label="City" required>
          <FormInput
            type="text"
            value={formData.City}
            onChange={(e) => handleInputChange('City', e.target.value)}
            placeholder="Enter city"
            required
          />
        </FormField>

        <FormField label="State" required>
          <FormInput
            type="text"
            value={formData.State}
            onChange={(e) => handleInputChange('State', e.target.value)}
            placeholder="Enter state abbreviation (e.g., CA)"
            required
          />
        </FormField>

        <FormField label="Postal Code" required>
          <FormInput
            type="text"
            value={formData.Zipcode}
            onChange={(e) => handleInputChange('Zipcode', e.target.value)}
            placeholder="Enter postal code"
            required
          />
        </FormField>
      </FormSection>

      {/* Legal Information */}
      <FormSection title="Legal Information">
        <FormField label="Tax ID" required={false}>
          <FormInput
            type="text"
            value={formData.TaxID}
            onChange={(e) => handleInputChange('TaxID', e.target.value)}
            placeholder="Enter tax ID"
          />
        </FormField>

        <FormField label="State Tax ID" required={false}>
          <FormInput
            type="text"
            value={formData.StateTaxID}
            onChange={(e) => handleInputChange('StateTaxID', e.target.value)}
            placeholder="Enter state tax ID"
          />
        </FormField>

        <FormField label="SOS File Number" required={false}>
          <FormInput
            type="text"
            value={formData.SOSFileNumber}
            onChange={(e) => handleInputChange('SOSFileNumber', e.target.value)}
            placeholder="Enter SOS file number"
          />
        </FormField>

        <FormField label="Tax Return Type" required={false}>
          <FormInput
            type="text"
            value={formData.TaxReturnType}
            onChange={(e) => handleInputChange('TaxReturnType', e.target.value)}
            placeholder="Enter tax return type"
          />
        </FormField>

        <FormField label="Acquisition Type" required={false}>
          <FormSelect
            value={formData.AcquisitionType}
            onChange={(e) => handleInputChange('AcquisitionType', e.target.value)}
            options={dropdownOptions.AcquisitionType || []}
            placeholder={loadingDropdowns ? 'Loading...' : 'Select Acquisition Type'}
            disabled={loadingDropdowns}
          />
        </FormField>
      </FormSection>

      {/* Contract Information */}
      <FormSection title="Contract Information">
        <FormField label="Contract Start" required={false}>
          <FormInput
            type="date"
            value={formData.ContractStart}
            onChange={(e) => handleInputChange('ContractStart', e.target.value)}
          />
        </FormField>

        <FormField label="Contract End" required={false}>
          <FormInput
            type="date"
            value={formData.ContractEnd}
            onChange={(e) => handleInputChange('ContractEnd', e.target.value)}
          />
        </FormField>
      </FormSection>

      {/* System Information */}
      <FormSection title="System Information">
        <FormField label="Active" required={false}>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.Active}
              onChange={(e) => handleInputChange('Active', e.target.checked)}
              className="w-4 h-4 text-royal-600 bg-surface border-primary rounded focus:ring-royal-500"
            />
            <span className="ml-2 text-sm text-secondary">Community is active</span>
          </div>
        </FormField>

        <FormField label="Third Party Identifier" required={false}>
          <FormInput
            type="text"
            value={formData.ThirdPartyIdentifier}
            onChange={(e) => handleInputChange('ThirdPartyIdentifier', e.target.value)}
            placeholder="Enter third party identifier"
          />
        </FormField>
      </FormSection>
    </FormTemplate>
  );
};

export default CreateCommunityForm;

