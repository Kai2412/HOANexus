import React, { useState, useEffect } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { 
  FormTemplate, 
  FormSection, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormTextarea 
} from '../FormTemplate';
import { AssignmentService } from '../../../services';
import { useLoading, useAuth } from '../../../context';
import logger from '../../../services/logger';

interface Community {
  id: number;
  pcode: string;
  name: string;
  displayName?: string;
}

interface CommunityAssignmentFormProps {
  selectedCommunity?: Community | null;
  onSuccess?: (assignment: any) => void;
  onCancel?: () => void;
}

interface AssignmentFormData {
  requestedCommunityID: number | undefined;
  requestedRoleType: 'Manager' | 'Director' | 'Assistant' | '';
  requestedRoleTitle: string;
  effectiveDate: string;
  endDate: string;
  notes: string;
  replacingStakeholderID: number | undefined;
  priority: 'Normal' | 'Urgent' | 'Emergency';
}

const CommunityAssignmentForm: React.FC<CommunityAssignmentFormProps> = ({ selectedCommunity, onSuccess, onCancel }) => {
  const { showLoading, hideLoading, setLoadingMessage } = useLoading();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    requestedCommunityID: selectedCommunity?.id,
    requestedRoleType: '',
    requestedRoleTitle: '',
    effectiveDate: '',
    endDate: '',
    notes: '',
    replacingStakeholderID: undefined,
    priority: 'Normal'
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof AssignmentFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleRoleTypeChange = (newRoleType: string) => {
    handleInputChange('requestedRoleType', newRoleType);
    // Reset role title when role type changes
    handleInputChange('requestedRoleTitle', '');
  };

  // Get available role titles based on selected role type
  const getAvailableRoleTitles = () => {
    const roleTitles = {
      'Manager': [
        'Community Manager',
        'On-site Manager'
      ],
      'Director': [
        'Regional Director'
      ],
      'Assistant': [
        'Manager in Training',
        'Maintenance Coordinator',
        'Compliance Specialist',
        'Accounting Specialist',
        'General Assistant'
      ]
    };
    return roleTitles[formData.requestedRoleType as keyof typeof roleTitles] || [];
  };

  // Update form data when selectedCommunity changes
  useEffect(() => {
    if (selectedCommunity) {
      setFormData(prev => ({
        ...prev,
        requestedCommunityID: selectedCommunity.id
      }));
    }
  }, [selectedCommunity]);

  const validateForm = (): string | null => {
    if (!formData.requestedCommunityID) return 'Community is required';
    if (!formData.requestedRoleType) return 'Role Type is required';
    if (!formData.requestedRoleTitle) return 'Role Title is required';
    if (!formData.effectiveDate) return 'Effective Date is required';
    if (!formData.notes.trim()) return 'Notes are required';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show global loading overlay
    showLoading('Submitting Assignment Request...', 'Creating your ticket and processing request');
    setError(null);

    try {
      if (!user) {
        setError('User not authenticated. Please log in again.');
        return;
      }
      
      const assignmentRequest = {
        communityID: formData.requestedCommunityID!,
        requestedRoleType: formData.requestedRoleType as 'Manager' | 'Director' | 'Assistant',
        requestedRoleTitle: formData.requestedRoleTitle,
        effectiveDate: formData.effectiveDate,
        endDate: formData.endDate || undefined,
        replacingStakeholderID: formData.replacingStakeholderID,
        priority: formData.priority,
        notes: formData.notes,
        createdBy: user.stakeholderId // Use actual logged-in user's stakeholder ID
      };

      logger.debug('Submitting assignment request', 'CommunityAssignmentForm', { assignmentRequest });
      
      // Update loading message during API call
      setLoadingMessage('Processing Request...', 'Saving to database...');
      
      const response = await AssignmentService.createAssignmentRequest(assignmentRequest);
      
      logger.debug('Assignment request created', 'CommunityAssignmentForm', { responseId: response.id });
      
      // Update loading message for success
      setLoadingMessage('Success!', `Ticket ${response.ticketNumber} created successfully`);
      
      setSuccess(true);
      
      // Hide loading and handle success after short delay
      setTimeout(() => {
        hideLoading();
        if (onSuccess) {
          onSuccess(response);
        }
      }, 1500);
    } catch (err: any) {
      logger.error('Error submitting assignment request', 'CommunityAssignmentForm', undefined, err as Error);
      hideLoading();
      setError(err.message || 'Failed to submit assignment request');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const breadcrumbs = [
    { 
      label: 'Forms', 
      onClick: handleCancel  // Go back to Forms categories
    },
    { label: 'Community Assignment', isActive: true }
  ];

  return (
    <FormTemplate
      formTitle="Community Assignment Request"
      formDescription="Request assignment to a community role"
      selectedCommunity={selectedCommunity}
      showCommunityContext={true}
      onCancel={onCancel}
      breadcrumbs={breadcrumbs}
      successMessage="Assignment request submitted successfully!"
      errorMessage={error || undefined}
      showSuccess={success}
      showError={!!error}
      onSubmit={handleSubmit}
      loading={false}
      submitButtonText="Submit Request"
      submitButtonIcon={<UserPlusIcon className="h-5 w-5" />}
    >
      {/* Assignment Details */}
      <FormSection title="Assignment Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Role Type */}
          <FormField label="Role Type" required>
            <FormSelect
              value={formData.requestedRoleType}
              onChange={handleRoleTypeChange}
              options={[
                { value: 'Assistant', label: 'Assistant' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Director', label: 'Director' }
              ]}
              placeholder="Select Role Type"
              required
            />
          </FormField>

          {/* Role Title */}
          <FormField label="Role Title" required>
            <FormSelect
              value={formData.requestedRoleTitle}
              onChange={(value) => handleInputChange('requestedRoleTitle', value)}
              options={getAvailableRoleTitles().map(title => ({ value: title, label: title }))}
              placeholder="Select Role Title"
              required
              disabled={!formData.requestedRoleType}
            />
          </FormField>

        </div>
      </FormSection>

      {/* Timing */}
      <FormSection title="Timing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Effective Date */}
          <FormField label="Effective Date" required>
            <FormInput
              type="date"
              value={formData.effectiveDate}
              onChange={(value) => handleInputChange('effectiveDate', value)}
              required
            />
          </FormField>

          {/* End Date */}
          <FormField label="End Date (Optional)">
            <FormInput
              type="date"
              value={formData.endDate}
              onChange={(value) => handleInputChange('endDate', value)}
            />
          </FormField>

        </div>
      </FormSection>

      {/* Additional Settings */}
      <FormSection title="Additional Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Priority */}
          <FormField label="Priority">
            <FormSelect
              value={formData.priority}
              onChange={(value) => handleInputChange('priority', value)}
              options={[
                { value: 'Normal', label: 'Normal' },
                { value: 'Urgent', label: 'Urgent' },
                { value: 'Emergency', label: 'Emergency' }
              ]}
            />
          </FormField>

        </div>
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes">
        <FormField label="Reason for Assignment Request" required>
          <FormTextarea
            value={formData.notes}
            onChange={(value) => handleInputChange('notes', value)}
            rows={4}
            placeholder="Please explain why this assignment is needed..."
            required
          />
        </FormField>
      </FormSection>

    </FormTemplate>
  );
};

export default CommunityAssignmentForm;
