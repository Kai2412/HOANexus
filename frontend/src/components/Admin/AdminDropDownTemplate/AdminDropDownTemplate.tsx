import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AdminDropDownTemplateProps {
  // Header props
  title: string;
  description: string;
  onClose?: () => void;
  
  // Breadcrumb props
  breadcrumbs: Array<{
    label: string;
    onClick?: () => void;
    isActive?: boolean;
  }>;
  
  // Content
  children: React.ReactNode;
}

const AdminDropDownTemplate: React.FC<AdminDropDownTemplateProps> = ({
  title,
  description,
  onClose,
  breadcrumbs,
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

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header/Banner */}
      <div className="flex-shrink-0 bg-surface-secondary border-b border-primary p-4">
        <div className="space-y-4">
          {/* Breadcrumbs */}
          <div>
            {renderBreadcrumbs()}
          </div>
          
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-primary">{title}</h1>
              <p className="text-sm text-secondary">{description}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-secondary hover:text-primary hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="overflow-y-auto px-6 pt-6 pb-9" style={{ height: 'calc(100vh - 250px)' }}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminDropDownTemplate;

