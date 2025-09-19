import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PlacesAutocomplete } from '../PlacesAutocomplete';

// Helper function to parse Google Places API (New) address components
const parseAddressComponents = (components: any[]) => {
  const addressData: Record<string, string> = {};
  
  components.forEach(component => {
    const types = component.types || [];
    
    if (types.includes('street_number')) {
      addressData.streetNumber = component.longText || component.long_name;
    } else if (types.includes('route')) {
      addressData.streetName = component.longText || component.long_name;
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
  type: 'text' | 'date' | 'select' | 'select-with-input' | 'number' | 'boolean' | 'textarea' | 'places-autocomplete';
  required?: boolean;
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
    custom?: (value: any) => string | null;
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
  error?: string;
  onFieldChange?: (key: string, value: any) => void;
}> = ({ field, value, onChange, error, onFieldChange }) => {
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
            value={value || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'select-with-input':
        return (
          <div className="space-y-2">
            <select
              value={value || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Or enter manually: <input
                type="text"
                value={value || ''}
                onChange={handleChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
            </div>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          />
        );

      case 'places-autocomplete':
        return (
          <PlacesAutocomplete
            value={value || ''}
            onChange={onChange}
            onPlaceSelected={(place: any) => {
              // Handle place selection and populate individual fields
              if (place && place.addressComponents) {
                // Parse address components and update form data
                const addressData = parseAddressComponents(place.addressComponents);
                
                // Update all the individual fields
                Object.entries(addressData).forEach(([key, value]) => {
                  if (value && onFieldChange) {
                    onFieldChange(key, value);
                  }
                });
              }
            }}
            placeholder={field.placeholder}
            className={`${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
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

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handle field value changes
  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.key];
      
      // Required field validation
      if (field.required && (!value || value === '')) {
        newErrors[field.key] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation?.custom && value) {
        const customError = field.validation.custom(value);
        if (customError) {
          newErrors[field.key] = customError;
        }
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

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      // Error handling will be done by the parent component
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData(initialData);
    setErrors({});
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
                    Edit {title}
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
                        onChange={(value) => handleFieldChange(field.key, value)}
                        error={errors[field.key]}
                        onFieldChange={onFieldChange}
                      />
                    );
                  })}
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
