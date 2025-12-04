# Form Validation Pattern

## Standard Validation Approach

This document defines the standard form validation pattern used across the HOA Nexus application.

### Pattern: Real-Time Validation

**Primary Approach:** Real-time validation with immediate feedback

### Implementation Details

#### 1. **Validation Triggers**
- **On Blur**: Validate when user leaves a field (primary trigger)
- **On Change**: Optional real-time validation as user types (for immediate feedback)
- **On Submit**: Final validation before save (catches any missed errors)

#### 2. **Error Display**
- **Inline Errors**: Show error message directly below the invalid field
- **Visual Indicators**: 
  - Red border on invalid fields (`border-red-500`)
  - Red focus ring (`focus:ring-red-500`)
  - Error message in red text below field
- **Error Messages**: Clear, specific messages (e.g., "Name is required", "Value must be at least 0")

#### 3. **Save Button Behavior**
- **Always Enabled**: Save button remains enabled (users can attempt save)
- **Validation on Click**: Final validation runs when Save is clicked
- **Error Summary**: If errors exist, show summary at top of form (optional)
- **Prevent Save**: Only prevent save if validation fails

#### 4. **Error Clearing**
- **Optimistic Clearing**: Clear error when user starts typing in a field
- **Re-validation**: Re-validate on blur to ensure field is valid before moving on

### Code Pattern

```typescript
// Field-level validation function
const validateSingleField = (field: FieldConfig, value: any): string | null => {
  // Required validation
  if (field.required && (!value || value === '')) {
    return `${field.label} is required`;
  }
  
  // Type-specific validation (number, date, etc.)
  // Custom validation
  // ...
  
  return null; // No error
};

// Validate on blur
const handleFieldBlur = (fieldKey: string) => {
  const value = formData[fieldKey];
  validateField(fieldKey, value);
};

// Clear error on change (optimistic)
const handleFieldChange = (fieldKey: string, value: any) => {
  // Clear error when user starts typing
  if (errors[fieldKey]) {
    setErrors(prev => ({ ...prev, [fieldKey]: '' }));
  }
  // Update form data
  setFormData(prev => ({ ...prev, [fieldKey]: value }));
};
```

### Visual Design

**Valid Field:**
- Border: `border-gray-300 dark:border-gray-600`
- Focus: `focus:ring-blue-500`
- No error message

**Invalid Field:**
- Border: `border-red-500`
- Focus: `focus:ring-red-500`
- Error message: `text-sm text-red-600 dark:text-red-400`

### Conditional Fields

- **Hidden Fields**: Skip validation for conditionally hidden fields
- **Dynamic Validation**: Re-validate when conditional dependencies change

### Benefits

1. **Immediate Feedback**: Users see errors as they work
2. **Less Frustration**: No guessing why Save is disabled
3. **Clear Guidance**: Errors point to specific fields
4. **Accessibility**: Screen readers can announce errors
5. **Industry Standard**: Matches common UX patterns

### Usage Example

```typescript
// In EditModal or form component
<FieldRenderer
  field={field}
  value={formData[field.key]}
  onChange={(value) => handleFieldChange(field.key, value, { validateOnChange: true })}
  onBlur={() => handleFieldBlur(field.key)}
  error={errors[field.key]}
/>
```

### Future Implementation

This pattern should be implemented across all forms in the application:
- Community Info forms
- Resident forms
- Amenity forms
- Admin forms
- Any other forms using EditModal or custom validation

### Notes

- Keep Save button enabled to allow users to see all errors at once
- Provide clear, actionable error messages
- Validate conditionally visible fields appropriately
- Consider accessibility (ARIA labels, screen reader announcements)

