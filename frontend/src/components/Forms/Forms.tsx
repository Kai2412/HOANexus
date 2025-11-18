import React, { useState } from 'react';
import CommunityAssignmentForm from './CommunityAssignmentForm';
import CreateCommunityForm from './CreateCommunityForm/CreateCommunityForm';

interface Community {
  id: number;
  pcode: string;
  name: string;
  displayName?: string;
}

interface FormsProps {
  onBackToCommunity?: () => void;
  onFormNavigation?: (category: string, form: string) => void;
  selectedCommunity?: Community | null;
  initialView?: string;
  initialForm?: string;
}

type FormView = 'categories' | 'community-assignment' | 'create-community';

const Forms: React.FC<FormsProps> = ({ onBackToCommunity, onFormNavigation, selectedCommunity, initialView, initialForm }) => {
  const [currentView, setCurrentView] = useState<FormView>(
    initialForm === 'community-assignment' ? 'community-assignment' :
    initialForm === 'create-community' ? 'create-community' :
    'categories'
  );
  const handleBreadcrumbClick = (target: 'community') => {
    if (target === 'community' && onBackToCommunity) {
      onBackToCommunity();
    }
  };

  const handleFormClick = (category: string, form: string) => {
    if (form === 'Community Assignment') {
      setCurrentView('community-assignment');
    } else if (form === 'Create Community') {
      setCurrentView('create-community');
    } else {
      // For other forms, use the callback
      if (onFormNavigation) {
        onFormNavigation(category, form);
      }
      console.log(`Clicked ${category} > ${form}`);
    }
  };

  const handleBackToForms = () => {
    setCurrentView('categories');
  };

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <button
          onClick={() => handleBreadcrumbClick('community')}
          className="text-secondary hover:text-primary transition-colors"
        >
          Community Info
        </button>
        <span className="text-tertiary">&gt;</span>
        <span className="text-primary font-medium">Forms</span>
      </div>
    );
  };

  // Render specific form if selected
  if (currentView === 'community-assignment') {
    return (
      <div className="h-full flex flex-col">
        <CommunityAssignmentForm
          selectedCommunity={selectedCommunity}
          onCancel={handleBackToForms}
          onSuccess={(assignment) => {
            console.log('Assignment submitted:', assignment);
            // TODO: Handle success (maybe show success message and go back to forms)
            handleBackToForms();
          }}
        />
      </div>
    );
  }

  if (currentView === 'create-community') {
    return (
      <div className="h-full flex flex-col">
        <CreateCommunityForm
          onCancel={handleBackToForms}
          onSuccess={(community) => {
            console.log('Community created:', community);
            handleBackToForms();
          }}
        />
      </div>
    );
  }

  // Render form categories
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
              <h1 className="text-xl font-semibold text-primary">Forms</h1>
              <p className="text-sm text-secondary">Select a category to view available forms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Operations Card */}
          <div className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-shadow theme-transition">
            <h3 className="text-lg font-semibold text-primary mb-4">Operations</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleFormClick('Operations', 'Community Assignment')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary"
              >
                • Community Assignment
              </button>
              <button
                onClick={() => handleFormClick('Operations', 'Maintenance Request')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • Maintenance Request (Coming Soon)
              </button>
              <button
                onClick={() => handleFormClick('Operations', 'Additional Services')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • Additional Services (Coming Soon)
              </button>
            </div>
          </div>

          {/* Accounting Card */}
          <div className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-shadow theme-transition">
            <h3 className="text-lg font-semibold text-primary mb-4">Accounting</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleFormClick('Accounting', 'Bank Account Request')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • Bank Account Request (Coming Soon)
              </button>
              <button
                onClick={() => handleFormClick('Accounting', 'GL Code Request')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • GL Code Request (Coming Soon)
              </button>
              <button
                onClick={() => handleFormClick('Accounting', 'Homeowner Refund')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • Homeowner Refund (Coming Soon)
              </button>
            </div>
          </div>

          {/* Misc Card */}
          <div className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-shadow theme-transition">
            <h3 className="text-lg font-semibold text-primary mb-4">Misc</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleFormClick('Misc', 'Lifestyle Event Planning')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • Lifestyle Event Planning (Coming Soon)
              </button>
              <button
                onClick={() => handleFormClick('Misc', 'Travel Expenses')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary opacity-50 cursor-not-allowed"
                disabled
              >
                • Travel Expenses (Coming Soon)
              </button>
            </div>
          </div>

          {/* Admin Card */}
          <div className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-shadow theme-transition">
            <h3 className="text-lg font-semibold text-primary mb-4">Admin</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleFormClick('Admin', 'Create Community')}
                className="w-full text-left text-secondary hover:text-primary transition-colors py-2 px-3 rounded hover:bg-surface-tertiary"
              >
                • Create Community
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Forms;
