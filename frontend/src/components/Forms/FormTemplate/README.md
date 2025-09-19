# Form Template System

This template system provides a consistent, reusable foundation for all forms in the HOA Nexus application.

## Components

### FormTemplate
The main template wrapper that provides:
- Consistent header with breadcrumbs
- Success/error message handling  
- Form container styling
- Action buttons (Cancel/Submit)
- Loading states

### FormSection
Groups related form fields with a title.

### FormField  
Individual field wrapper with label and error handling.

### FormInput
Standardized text input with consistent styling.

### FormSelect
Standardized dropdown with consistent styling.

### FormTextarea
Standardized textarea with consistent styling.

## Usage Example

```tsx
import React, { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { 
  FormTemplate, 
  FormSection, 
  FormField, 
  FormInput, 
  FormSelect, 
  FormTextarea 
} from '../FormTemplate';

const MyCustomForm: React.FC<MyCustomFormProps> = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    field3: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Your API call here
      await submitForm(formData);
      setSuccess(true);
      setTimeout(() => onSuccess?.(formData), 1500);
    } catch (err) {
      setError('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Community Info', onClick: onCancel },
    { label: 'Forms', onClick: onCancel },
    { label: 'My Custom Form', isActive: true }
  ];

  return (
    <FormTemplate
      formTitle="My Custom Form"
      formDescription="Description of what this form does"
      onCancel={onCancel}
      breadcrumbs={breadcrumbs}
      successMessage="Custom form submitted successfully!"
      errorMessage={error}
      showSuccess={success}
      showError={!!error}
      onSubmit={handleSubmit}
      loading={loading}
      submitButtonText="Submit Request"
      submitButtonIcon={<UserPlusIcon className="h-5 w-5" />}
    >
      {/* Form Content */}
      <FormSection title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Field 1" required>
            <FormInput
              value={formData.field1}
              onChange={(value) => setFormData(prev => ({ ...prev, field1: value }))}
              placeholder="Enter field 1"
              required
            />
          </FormField>
          
          <FormField label="Field 2">
            <FormSelect
              value={formData.field2}
              onChange={(value) => setFormData(prev => ({ ...prev, field2: value }))}
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' }
              ]}
              placeholder="Select an option"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Additional Information">
        <FormField label="Comments" required>
          <FormTextarea
            value={formData.field3}
            onChange={(value) => setFormData(prev => ({ ...prev, field3: value }))}
            placeholder="Enter your comments..."
            rows={4}
            required
          />
        </FormField>
      </FormSection>
    </FormTemplate>
  );
};
```

## Benefits

1. **Consistency** - All forms look and behave the same
2. **Maintainability** - Update one template, affects all forms
3. **Speed** - Quick to create new forms
4. **Accessibility** - Built-in ARIA labels and focus management
5. **Theming** - Automatic dark/light mode support
6. **Validation** - Consistent error handling patterns

## Styling

All components use the application's design system:
- `bg-surface-secondary` for form containers
- `border-primary` for borders  
- `text-primary` for main text
- `text-secondary` for descriptions
- `focus:ring-royal-500` for focus states
- `theme-transition` for smooth theme switching

## Future Enhancements

- Field validation rules
- Conditional field rendering
- File upload components
- Multi-step form support
- Auto-save functionality
