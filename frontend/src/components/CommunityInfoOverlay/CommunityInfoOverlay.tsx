import React, { useEffect, useState } from 'react';
import NavigationSidebar from '../NavigationSidebar';
import ContentDisplayArea from '../ContentDisplayArea';
import type { Community } from '../../types';

interface CommunityInfoOverlayProps {
  selectedCommunity: Community | null;
}

const CommunityInfoOverlay: React.FC<CommunityInfoOverlayProps> = ({ selectedCommunity }) => {
  const [selectedNavigationItemId, setSelectedNavigationItemId] = useState<string | null>('general');

  useEffect(() => {
    // Ensure we always default to 'general' when the community changes
    setSelectedNavigationItemId('general');
  }, [selectedCommunity?.id]);

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
    <div className="h-full flex bg-surface theme-transition">
      {/* Navigation Sidebar - Left Side */}
      <NavigationSidebar
        selectedItemId={selectedNavigationItemId}
        onItemSelect={setSelectedNavigationItemId}
      />

      {/* 10px gap between sidebar and community info section */}
      <div className="w-[10px]" />

      {/* Content Display Area - Right Side (flex-1 to take remaining space) */}
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <ContentDisplayArea
          selectedItemId={selectedNavigationItemId}
          selectedCommunity={selectedCommunity}
        />
      </div>
    </div>
  );
};

export default CommunityInfoOverlay;
