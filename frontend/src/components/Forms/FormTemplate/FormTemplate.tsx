import React from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Community {
  id: number;
  pcode: string;
  name: string;
  displayName?: string;
}

interface FormTemplateProps {
  // Header props
  formTitle: string;
  formDescription: string;
  onCancel?: () => void;
  
  // Community props
  selectedCommunity?: Community | null;
  showCommunityContext?: boolean;
  
  // Breadcrumb props
  breadcrumbs: Array<{
    label: string;
    onClick?: () => void;
    isActive?: boolean;
  }>;
  
  // Message props
  successMessage?: string;
  errorMessage?: string;
  showSuccess?: boolean;
  showError?: boolean;
  
  // Form props
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  
  // Button props
  submitButtonText?: string;
  submitButtonIcon?: React.ReactNode;
  cancelButtonText?: string;
  
  // Content
  children: React.ReactNode;
}

const FormTemplate: React.FC<FormTemplateProps> = ({
  formTitle,
  formDescription,
  onCancel,
  selectedCommunity,
  showCommunityContext = true,
  breadcrumbs,
  successMessage = 'Form submitted successfully!',
  errorMessage,
  showSuccess = false,
  showError = false,
  onSubmit,
  loading = false,
  submitButtonText = 'Submit',
  submitButtonIcon,
  cancelButtonText = 'Cancel',
  children
}) => {
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-tertiary">&gt;</span>}
            {crumb.isActive ? (
              <span className="text-primary font-medium">{crumb.label}</span>
            ) : (
              <button
                onClick={crumb.onClick}
                className="text-secondary hover:text-primary transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderCommunityContext = () => {
    if (!showCommunityContext) return null;
    
    return (
      <div className="bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800 rounded-lg p-4 mb-6">
        <div className="text-center">
          <span className="text-sm text-secondary">Submitting for Community:</span>
          {selectedCommunity ? (
            <p className="text-lg font-semibold text-royal-600 dark:text-royal-400 mt-1">
              {selectedCommunity.pcode} - {selectedCommunity.displayName || selectedCommunity.name}
            </p>
          ) : (
            <p className="text-lg font-medium text-amber-600 dark:text-amber-400 mt-1">
              Please select a community from the left panel
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-primary p-4">
        <div className="space-y-4">
          {/* Breadcrumbs */}
          <div>
            {renderBreadcrumbs()}
          </div>
          
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-primary">{formTitle}</h1>
              <p className="text-sm text-secondary">{formDescription}</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 text-secondary hover:text-primary hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {showError && errorMessage && (
            <div className="mb-6 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Community Context */}
          {renderCommunityContext()}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-surface-secondary border border-primary rounded-lg p-6 space-y-6">
              {children}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 border border-primary text-primary hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  {cancelButtonText}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-royal-600 hover:bg-royal-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    {submitButtonIcon}
                    <span>{submitButtonText}</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default FormTemplate;
