import React from 'react';

interface InfoViewTemplateProps {
  // Header content (title, pills, search, etc.)
  header: React.ReactNode;
  
  // Main content area (cards, tables, etc.)
  children: React.ReactNode;
  
  // Optional: whether search results banner is visible (for height calculation)
  hasSearchResults?: boolean;
  
  // Optional: custom maxHeight calculation override
  maxHeightOffset?: number;
  
  // Optional: additional classes for the content container
  contentClassName?: string;
}

/**
 * InfoViewTemplate - Reusable template for info views with fixed header and scrollable content
 * 
 * This template ensures consistent layout and proper scrolling behavior across all info views:
 * - CommunityInfo (cards)
 * - CommunityFees (tables)
 * - Residents (lists)
 * - Amenities (cards)
 * 
 * Pattern:
 * - Fixed header section (title, pills, search, etc.)
 * - Scrollable content section below
 */
const InfoViewTemplate: React.FC<InfoViewTemplateProps> = ({
  header,
  children,
  hasSearchResults = false,
  maxHeightOffset = 300, // Default offset
  contentClassName = ''
}) => {
  // Calculate maxHeight: adjust if search results banner is visible
  const searchBannerHeight = 60; // Approximate height of search results banner
  const calculatedMaxHeight = hasSearchResults 
    ? `calc(100vh - ${maxHeightOffset + searchBannerHeight}px)`
    : `calc(100vh - ${maxHeightOffset}px)`;

  return (
    <div className="h-full flex flex-col overflow-hidden p-6">
      {/* Fixed Header Section */}
      <header className="flex-shrink-0 space-y-4 pb-6">
        {header}
      </header>

      {/* Scrollable Content Section */}
      <div 
        className={`flex-1 overflow-y-auto min-h-0 -mx-6 px-6 ${contentClassName}`}
        style={{ maxHeight: calculatedMaxHeight }}
      >
        {children}
      </div>
    </div>
  );
};

export default InfoViewTemplate;

