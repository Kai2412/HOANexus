// ContentDisplayArea Component
// This component displays the selected navigation item's content
// It acts as a wrapper that cycles through different content components

import React from 'react';
import { findNavigationItem, type NavigationItem } from '../../config/navigationConfig';
import type { Community } from '../../types';

interface ContentDisplayAreaProps {
  // The ID of the currently selected navigation item
  selectedItemId: string | null;
  
  // The currently selected community
  selectedCommunity: Community | null;
}

const ContentDisplayArea: React.FC<ContentDisplayAreaProps> = ({
  selectedItemId,
  selectedCommunity
}) => {
  // Find the navigation item configuration
  const navigationItem: NavigationItem | undefined = selectedItemId
    ? findNavigationItem(selectedItemId)
    : undefined;

  // If no item is selected, show placeholder
  if (!selectedItemId || !navigationItem) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-secondary theme-transition">
        <div className="text-center">
          <p className="text-lg text-secondary mb-2">Select an item from the navigation</p>
          <p className="text-sm text-tertiary">Choose a section to view its content</p>
        </div>
      </div>
    );
  }

  // Get the component to render
  const ContentComponent = navigationItem.component;

  // Render the selected component
  // Use bg-surface-secondary to match sidebar, creating a visual "box" around the content area
  // Cards inside will use bg-surface for contrast
  // No padding here - let child component handle padding for proper scroll isolation
  return (
    <div className="h-full bg-surface-secondary theme-transition">
      <ContentComponent community={selectedCommunity} />
    </div>
  );
};

export default ContentDisplayArea;

