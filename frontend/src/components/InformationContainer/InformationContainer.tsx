import React from 'react';
import Directory from '../Directory/Directory';
import AddStakeholder from '../Directory/AddStakeholder';
import Forms from '../Forms/Forms';
import Admin from '../Admin/Admin';
import Tickets from '../Tickets';
import Invoice from '../Invoice';
import CommunityInfoOverlay from '../CommunityInfoOverlay';
import type { Community } from '../../types';

interface InformationContainerProps {
  selectedCommunity: Community | null;
  currentOverlay?: 'community-info' | 'directory' | 'add-stakeholder' | 'forms' | 'tickets' | 'reports' | 'settings' | 'admin' | 'invoice' | null;
  overlayParams?: Record<string, any>;
}

const InformationContainer: React.FC<InformationContainerProps> = ({ 
  selectedCommunity,
  currentOverlay = null,
  overlayParams = {}
}) => {
  // Render specific overlays when requested
  if (currentOverlay && currentOverlay !== 'community-info') {
    return (
      <div className="h-full bg-surface theme-transition">
        {currentOverlay === 'directory' && (
          <div className="h-full flex flex-col">
            <Directory 
              onBackToCommunity={() => {
                window.dispatchEvent(new CustomEvent('overlay:close'));
              }}
              onAddStakeholder={() => {
                window.dispatchEvent(new CustomEvent('overlay:navigate', { 
                  detail: { overlay: 'add-stakeholder' } 
                }));
              }}
            />
          </div>
        )}
        {currentOverlay === 'add-stakeholder' && (
          <div className="h-full flex flex-col">
            {/* Add Stakeholder Header */}
            <div className="bg-surface-secondary border-b border-primary p-4 flex-shrink-0">
              <div className="space-y-4">
                {/* Breadcrumbs */}
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('overlay:navigate', { detail: { overlay: 'directory' } }))}
                    className="text-secondary hover:text-primary transition-colors"
                  >
                    Directory
                  </button>
                  <span className="text-tertiary">&gt;</span>
                  <span className="text-primary font-medium">Add New</span>
                </div>
                
                {/* Title */}
                <div>
                  <h1 className="text-xl font-semibold text-primary">Add New Stakeholder</h1>
                  <p className="text-sm text-secondary">Create a new stakeholder in the community directory</p>
                </div>
              </div>
            </div>
            
            {/* Scrollable Form */}
            <div className="overflow-y-auto p-6" style={{ height: 'calc(100vh - 235px)' }}>
              <AddStakeholder 
                onSuccess={() => {
                  // Go back to directory after successful creation
                  window.dispatchEvent(new CustomEvent('overlay:navigate', { 
                    detail: { overlay: 'directory' } 
                  }));
                }}
                onCancel={() => {
                  // Go back to directory on cancel
                  window.dispatchEvent(new CustomEvent('overlay:navigate', { 
                    detail: { overlay: 'directory' } 
                  }));
                }}
              />
            </div>
          </div>
        )}
        {currentOverlay === 'forms' && (
          <div className="h-full flex flex-col">
            <Forms 
              selectedCommunity={selectedCommunity}
              initialView={overlayParams.view}
              initialForm={overlayParams.form}
              onBackToCommunity={() => {
                window.dispatchEvent(new CustomEvent('overlay:close'));
              }}
              onFormNavigation={(category, form) => {
                // Form navigation is handled by the Forms component
                // Logging handled by Forms component
              }}
            />
          </div>
        )}
        {currentOverlay === 'tickets' && (
          <Tickets 
            onClose={() => {
              window.dispatchEvent(new CustomEvent('overlay:close'));
            }}
          />
        )}
        {currentOverlay === 'reports' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Reports</h2>
              <p className="text-secondary mb-6">Reports functionality coming soon...</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('overlay:close'))}
                className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 transition-colors"
              >
                Back to Community
              </button>
            </div>
          </div>
        )}
        {currentOverlay === 'settings' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Settings</h2>
              <p className="text-secondary mb-6">Settings panel coming soon...</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('overlay:close'))}
                className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 transition-colors"
              >
                Back to Community
              </button>
            </div>
          </div>
        )}
        {currentOverlay === 'admin' && (
          <div className="h-full flex flex-col">
            <Admin 
              onClose={() => {
                window.dispatchEvent(new CustomEvent('overlay:close'));
              }}
            />
          </div>
        )}
        {currentOverlay === 'invoice' && (
          <div className="h-full flex flex-col">
            <Invoice 
              onBack={() => {
                window.dispatchEvent(new CustomEvent('overlay:close'));
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Default overlay: Community Info (sidebar + cards)
  return (
    <div className="h-full">
      <CommunityInfoOverlay selectedCommunity={selectedCommunity} />
    </div>
  );
};

export default InformationContainer;
