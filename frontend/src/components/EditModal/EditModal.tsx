import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PlacesAutocomplete } from '../PlacesAutocomplete';
import logger from '../../services/logger';

// Helper function to parse Google Places API (New) address components
const parseAddressComponents = (components: any[]) => {
  const addressData: Record<string, string> = {};
  
  components.forEach(component => {
    const types = component.types || [];
    
    if (types.includes('street_number')) {
      addressData.streetNumber = component.longText || component.long_name;
    } else if (types.includes('route')) {
      addressData.streetName = component.longText || component.long_name;
    } else if (types.includes('subpremise')) {
      addressData.addressLine2 = component.longText || component.long_name;
    } else if (types.includes('locality')) {
      addressData.city = component.longText || component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      addressData.state = component.shortText || component.short_name;
    } else if (types.includes('postal_code')) {
      addressData.postalCode = component.longText || component.long_name;
    } else if (types.includes('country')) {
      addressData.country = (component.shortText || component.short_name) === 'US' ? 'USA' : (component.shortText || component.short_name);
    }
  });
  
  // Combine street number and name into addressLine1
  if (addressData.streetNumber && addressData.streetName) {
    addressData.addressLine1 = `${addressData.streetNumber} ${addressData.streetName}`;
  } else if (addressData.streetName) {
    addressData.addressLine1 = addressData.streetName;
  }
  
  return addressData;
};

// Field configuration interface
export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'select-with-input' | 'number' | 'boolean' | 'textarea' | 'places-autocomplete' | 'day';
  required?: boolean;
  disabled?: boolean; // For disabling fields
  options?: { value: string; label: string }[]; // For select fields
  placeholder?: string;
  conditional?: {
    dependsOn: string;
    showWhen: any;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any, formData?: Record<string, any>) => string | null;
  };
  // Conditional requirement: field is required when another field has a specific value
  conditionalRequired?: {
    dependsOn: string;
    requiredWhen: any;
  };
}

// Modal props interface
export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  initialData: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  onFieldChange?: (key: string, value: any) => void;
}

// Individual field renderer
const FieldRenderer: React.FC<{
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  onFieldChange?: (key: string, value: any, options?: { skipPendingReset?: boolean }) => void;
  onAddressSelection?: (fieldKey: string, formattedAddress: string, updates: Record<string, string>) => void;
  pendingAddress?: { fieldKey: string; formatted: string; updates: Record<string, string> } | null;
  onApplyPendingAddress?: () => void;
  onClearPendingAddress?: () => void;
}> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  onFieldChange,
  onAddressSelection,
  pendingAddress,
  onApplyPendingAddress,
  onClearPendingAddress
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue: any = e.target.value;
    
    // Handle different input types
    if (field.type === 'number') {
      newValue = newValue ? parseFloat(newValue) : '';
    } else if (field.type === 'boolean') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    
    onChange(newValue);
  };

  const renderInput = () => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value ?? ''}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={field.disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              field.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="" disabled hidden>
              {field.placeholder || `Select ${field.label}`}
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'select-with-input':
        return (
          <select
            value={value ?? ''}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={field.disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              field.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="" disabled hidden>
              {field.placeholder || `Select ${field.label}`}
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={field.placeholder}
            rows={3}
            disabled={field.disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              field.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {value ? 'Yes' : 'No'}
            </span>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={handleChange}
            onBlur={onBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          />
        );

      case 'day': {
        // Convert day number (1-31) to a date string for the date picker
        // Use a fixed year/month (2024-01) so only the day matters
        const dayNumber = value ? Number(value) : null;
        const dateValue = dayNumber && dayNumber >= 1 && dayNumber <= 31 
          ? `2024-01-${String(dayNumber).padStart(2, '0')}` 
          : '';
        
        const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const dateStr = e.target.value;
          if (dateStr) {
            // Extract just the day from the date string
            const date = new Date(dateStr);
            const day = date.getDate();
            onChange({ target: { value: String(day) } } as React.ChangeEvent<HTMLInputElement>);
          } else {
            onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
          }
        };

        return (
          <input
            type="date"
            value={dateValue}
            onChange={handleDayChange}
            onBlur={onBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          />
        );
      }

      case 'places-autocomplete': {
        const pendingForField =
          pendingAddress && pendingAddress.fieldKey === field.key ? pendingAddress : null;

        const fieldLabelMap: Record<string, string> = {
          Address: 'Address Line 1',
          Address2: 'Address Line 2',
          City: 'City',
          State: 'State',
          Zipcode: 'Postal Code'
        };

        return (
          <div className="space-y-3">
            <PlacesAutocomplete
              value={value ?? ''}
              onChange={onChange}
              onPlaceSelected={(place: any) => {
                if (!place) {
                  return;
                }

                const formattedAddress =
                  place.formattedAddress ||
                  place.formatted_address ||
                  value ||
                  '';

                const components =
                  place.addressComponents ||
                  place.address_components ||
                  [];

                const parsedData = parseAddressComponents(components);

                const fieldMapping: Record<string, string> = {
                  addressLine1: 'Address',
                  addressLine2: 'Address2',
                  city: 'City',
                  state: 'State',
                  postalCode: 'Zipcode'
                };

                const updates: Record<string, string> = {};

                Object.entries(fieldMapping).forEach(([sourceKey, targetKey]) => {
                  const parsedValue = parsedData[sourceKey];
                  if (parsedValue) {
                    updates[targetKey] = parsedValue;
                  }
                });

                onAddressSelection?.(field.key, formattedAddress, updates);
              }}
              placeholder={field.placeholder}
              className={`${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            />

            {pendingForField && Object.keys(pendingForField.updates).length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 dark:border-blue-700/60 dark:bg-blue-900/20 dark:text-blue-100">
                <p className="text-sm font-medium">Apply address details to the form?</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {Object.entries(pendingForField.updates).map(([key, val]) =>
                    val ? (
                      <li key={key}>
                        <span className="font-semibold">{fieldLabelMap[key] ?? key}:</span>{' '}
                        {val}
                      </li>
                    ) : null
                  )}
                </ul>
                <div className="mt-3 flex gap-2">
                  {onApplyPendingAddress && (
                    <button
                      type="button"
                      onClick={onApplyPendingAddress}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  )}
                  {onClearPendingAddress && (
                    <button
                      type="button"
                      onClick={onClearPendingAddress}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <input
            type={field.type}
            value={value ?? ''}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              field.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

// Main EditModal component
const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  title,
  fields,
  initialData,
  onSave,
  isLoading = false,
  onFieldChange
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingAddress, setPendingAddress] = useState<{
    fieldKey: string;
    formatted: string;
    updates: Record<string, string>;
  } | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
      setSaveError(null);
      setPendingAddress(null);
    }
  }, [isOpen, initialData]);

  // Re-validate dependent fields when their dependencies change
  // Use a ref to track the last changed field to avoid infinite loops
  const lastChangedFieldRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (lastChangedFieldRef.current) {
      const changedFieldKey = lastChangedFieldRef.current;
      lastChangedFieldRef.current = null; // Reset
      
      // Re-validate fields that depend on the changed field
      fields.forEach(field => {
        if (field.conditionalRequired?.dependsOn === changedFieldKey || field.conditional?.dependsOn === changedFieldKey) {
          const fieldValue = formData[field.key];
          validateField(field.key, fieldValue);
        }
      });
    }
  }, [formData]);

  // Validate a single field and return error message
  const validateSingleField = (field: FieldConfig, value: any): string | null => {
    // Check if field is required (static or conditional)
    let isRequired = field.required;
    
    // Check conditional requirement
    if (field.conditionalRequired) {
      const dependentValue = formData[field.conditionalRequired.dependsOn];
      if (dependentValue === field.conditionalRequired.requiredWhen) {
        isRequired = true;
      }
    }
    
    // Required field validation
    if (isRequired && (!value || value === '' || (typeof value === 'number' && isNaN(value)))) {
      return `${field.label} is required`;
    }

    // Number validation
    if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
    }

    // Custom validation (pass formData for context)
    if (field.validation?.custom) {
      const customError = field.validation.custom(value, formData);
      if (customError) {
        return customError;
      }
    }

    return null;
  };

  // Validate a single field (updates errors state)
  const validateField = (fieldKey: string, value: any) => {
    const field = fields.find(f => f.key === fieldKey);
    if (!field) return;

    // Skip validation for conditionally hidden fields
    if (field.conditional) {
      const dependentValue = formData[field.conditional.dependsOn];
      if (dependentValue !== field.conditional.showWhen) {
        // Field is hidden, clear any errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldKey];
          return newErrors;
        });
        return;
      }
    }

    const fieldError = validateSingleField(field, value);
    setErrors(prev => ({
      ...prev,
      [fieldKey]: fieldError || ''
    }));
  };

  // Handle field blur (validate when user leaves field)
  const handleFieldBlur = (fieldKey: string) => {
    const value = formData[fieldKey];
    validateField(fieldKey, value);
  };

  // Handle field value changes
  const handleFieldChange = (
    fieldKey: string,
    value: any,
    options: { skipPendingReset?: boolean; validateOnChange?: boolean } = {}
  ) => {
    // Track which field changed for dependent field re-validation
    lastChangedFieldRef.current = fieldKey;
    
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    if (
      !options.skipPendingReset &&
      pendingAddress &&
      (fieldKey === pendingAddress.fieldKey || pendingAddress.updates[fieldKey] !== undefined)
    ) {
      setPendingAddress(null);
    }

    // Clear error when user starts typing (optimistic clearing)
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }));
    }
    
    // Trigger real-time validation if enabled
    if (options.validateOnChange) {
      validateField(fieldKey, value);
    }
    // Note: Dependent fields will be re-validated via useEffect when formData updates
  };

  const handleAddressSelection = (
    fieldKey: string,
    formattedAddress: string,
    updates: Record<string, string>
  ) => {
    handleFieldChange(fieldKey, formattedAddress, { skipPendingReset: true });

    if (Object.keys(updates).length > 0) {
      setPendingAddress({ fieldKey, formatted: formattedAddress, updates });
    } else {
      setPendingAddress(null);
    }
  };

  const applyPendingAddress = () => {
    if (!pendingAddress) return;

    Object.entries(pendingAddress.updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        handleFieldChange(key, value, { skipPendingReset: true });
      }
    });

    setPendingAddress(null);
  };

  const clearPendingAddress = () => setPendingAddress(null);

  // Validate form (used on save click - validates all fields)
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      // Skip validation for conditionally hidden fields
      if (field.conditional) {
        const dependentValue = formData[field.conditional.dependsOn];
        if (dependentValue !== field.conditional.showWhen) {
          return; // Skip validation for hidden fields
        }
      }
      
      const value = formData[field.key];
      const fieldError = validateSingleField(field, value);
      if (fieldError) {
        newErrors[field.key] = fieldError;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaveError(null); // Clear previous errors
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      logger.error('Save failed', 'EditModal', undefined, error as Error);
      // Display error message to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to save. Please try again.';
      setSaveError(errorMessage);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData(initialData);
    setErrors({});
    setPendingAddress(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancel}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {title.startsWith('Add ') || title.startsWith('New ') ? title : `Edit ${title}`}
                  </Dialog.Title>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {fields.map((field) => {
                    // Check conditional visibility
                    if (field.conditional) {
                      const dependentValue = formData[field.conditional.dependsOn];
                      if (dependentValue !== field.conditional.showWhen) {
                        return null; // Don't render this field
                      }
                    }
                    
                    return (
                      <FieldRenderer
                        key={field.key}
                        field={field}
                        value={formData[field.key]}
                        onChange={(value) => handleFieldChange(field.key, value, { validateOnChange: true })}
                        onBlur={() => handleFieldBlur(field.key)}
                        error={errors[field.key]}
                        onFieldChange={(key, value, options) => handleFieldChange(key, value, options)}
                        onAddressSelection={handleAddressSelection}
                        pendingAddress={pendingAddress}
                        onApplyPendingAddress={applyPendingAddress}
                        onClearPendingAddress={clearPendingAddress}
                      />
                    );
                  })}
                  
                  {/* Save Error Display */}
                  {saveError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">{saveError}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditModal;
