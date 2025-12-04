// NavigationSidebar Component
// This component displays the hierarchical sidebar navigation
// It shows sections (Community Info, Residents, Amenities) with their items

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { navigationConfig, type NavigationSection, type NavigationItem } from '../../config/navigationConfig';

interface NavigationSidebarProps {
  // Currently selected navigation item ID
  selectedItemId: string | null;
  
  // Callback when a navigation item is clicked
  onItemSelect: (itemId: string) => void;
  
  // Optional: User role for future role-based filtering
  userRole?: string;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  selectedItemId,
  onItemSelect,
  userRole = 'Manager' // Default for now, will be dynamic later
}) => {
  // Track which sections are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(navigationConfig.map(section => section.id))
  );

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Check if user has required role (future implementation)
  const hasRequiredRole = (requiredRoles?: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(userRole);
  };

  return (
    <div className="w-[250px] h-full bg-surface-secondary border-r border-primary theme-transition overflow-y-auto">
      <div className="p-4">
        {/* Sidebar Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary">Navigation</h2>
          <p className="text-xs text-secondary mt-1">Select a section to view</p>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-2">
          {navigationConfig.map((section: NavigationSection) => {
            // Skip section if user doesn't have required role
            if (!hasRequiredRole(section.requiredRole)) {
              return null;
            }

            const isExpanded = expandedSections.has(section.id);
            const SectionIcon = section.icon;

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header - Clickable to expand/collapse */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-5 h-5 text-royal-600 dark:text-royal-400 group-hover:text-royal-700 dark:group-hover:text-royal-300" />
                    <span className="font-medium text-primary group-hover:text-royal-600 dark:group-hover:text-royal-400">
                      {section.label}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-secondary" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-secondary" />
                  )}
                </button>

                {/* Section Items - Shown when expanded */}
                {isExpanded && (
                  <div className="ml-7 space-y-1">
                    {section.items.map((item: NavigationItem) => {
                      // Skip item if user doesn't have required role
                      if (!hasRequiredRole(item.requiredRole)) {
                        return null;
                      }

                      const isSelected = selectedItemId === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onItemSelect(item.id)}
                          className={`
                            w-full text-left px-3 py-2 rounded-md transition-colors
                            ${
                              isSelected
                                ? 'bg-royal-600 text-white dark:bg-royal-500'
                                : 'text-secondary hover:bg-surface hover:text-primary'
                            }
                          `}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default NavigationSidebar;

