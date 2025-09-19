import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import CommunityInfo from '../CommunityInfo/CommunityInfo';
import ResidentInfo from '../ResidentInfo/ResidentInfo';
import AmenitiesInfo from '../AmenitiesInfo/AmenitiesInfo';
import Directory from '../Directory/Directory';
import AddStakeholder from '../Directory/AddStakeholder';
import Forms from '../Forms/Forms';
import Tickets from '../Tickets';
import type { Community } from '../../types';
import { useCommunity } from '../../context';

interface InformationContainerProps {
  selectedCommunity: Community | null;
  currentOverlay?: 'directory' | 'add-stakeholder' | 'forms' | 'tickets' | 'reports' | 'settings' | null;
  overlayParams?: Record<string, any>;
}

const InformationContainer: React.FC<InformationContainerProps> = ({ 
  selectedCommunity,
  currentOverlay = null,
  overlayParams = {}
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const { communities, updateSelectedCommunity } = useCommunity();

  const tabs = [
    { name: 'Community Info', component: CommunityInfo },
    { name: 'Resident Info', component: ResidentInfo },
    { name: 'Amenities', component: AmenitiesInfo }
  ];

  // Render overlay if active
  if (currentOverlay) {
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
                    onClick={() => window.dispatchEvent(new CustomEvent('overlay:close'))}
                    className="text-secondary hover:text-primary transition-colors"
                  >
                    Community Info
                  </button>
                  <span className="text-tertiary">&gt;</span>
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
          <Forms 
            selectedCommunity={selectedCommunity}
            initialView={overlayParams.view}
            initialForm={overlayParams.form}
            onBackToCommunity={() => {
              window.dispatchEvent(new CustomEvent('overlay:close'));
            }}
            onFormNavigation={(category, form) => {
              console.log(`Navigate to form: ${category} > ${form}`);
              // TODO: Implement form navigation
            }}
          />
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
      </div>
    );
  }

  if (!selectedCommunity) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-surface theme-transition">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-primary mb-4">Select a Community</h2>
          <p className="text-secondary">Choose a community from the left panel to view detailed information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface theme-transition">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        {/* Tab Navigation - Fixed Header */}
        <div className="flex-shrink-0 border-b border-primary bg-surface shadow-sm theme-transition">
          <Tab.List className="flex">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex-1 py-4 px-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-royal-500 focus:ring-inset theme-transition ${
                    selected
                      ? 'text-royal-600 dark:text-royal-400 border-b-2 border-royal-600 dark:border-royal-400 bg-royal-50 dark:bg-royal-900/20'
                      : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                  }`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
        </div>

        {/* Tab Content - Scrollable Area */}
        <div className="flex-1 min-h-0 bg-surface-secondary theme-transition">
          <Tab.Panels className="h-full">
            {/* Community Info Panel */}
            <Tab.Panel className="h-full">
              <div className="overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
                <CommunityInfo 
                  community={selectedCommunity} 
                  communities={communities}
                  onCommunityUpdate={updateSelectedCommunity}
                />
              </div>
            </Tab.Panel>

            {/* Resident Info Panel */}
            <Tab.Panel className="h-full">
              <div className="overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
                <ResidentInfo community={selectedCommunity} />
              </div>
            </Tab.Panel>

            {/* Amenities Panel */}
            <Tab.Panel className="h-full">
              <div className="overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
                <AmenitiesInfo community={selectedCommunity} />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </div>
  );
};

export default InformationContainer;
