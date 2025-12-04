// Navigation Configuration
// This file defines the structure of the sidebar navigation
// Each section can have multiple items that display different content

import React from 'react';
import { BuildingOfficeIcon, UserGroupIcon, HomeIcon, FolderIcon } from '@heroicons/react/24/outline';
import CommunityInfo from '../components/CommunityInfo/CommunityInfo';
import CommunityFees from '../components/CommunityFees/CommunityFees';
import CommunityCommitments from '../components/CommunityCommitments/CommunityCommitments';
import ResidentInfo from '../components/ResidentInfo/ResidentInfo';
import AmenitiesInfo from '../components/AmenitiesInfo/AmenitiesInfo';
import FileBrowser from '../components/FileBrowser/FileBrowser';
import type { Community } from '../types';

// Navigation Item Component Type
export type NavigationItemComponent = React.ComponentType<{ community: Community | null }>;

// Navigation Item Definition
export interface NavigationItem {
  id: string;
  label: string;
  component: NavigationItemComponent;
  requiredRole?: string[]; // For future role-based access control
}

// Navigation Section Definition
export interface NavigationSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string[]; // For future role-based access control
  items: NavigationItem[];
}

// Navigation Configuration
// This is the master configuration for all sidebar navigation
export const navigationConfig: NavigationSection[] = [
  {
    id: 'community-info',
    label: 'Community Info',
    icon: BuildingOfficeIcon,
    requiredRole: ['Manager', 'Basic Employee'], // Future: role-based visibility
    items: [
      {
        id: 'general',
        label: 'General',
        component: CommunityInfo,
        requiredRole: ['Manager', 'Basic Employee']
      },
      {
        id: 'fees',
        label: 'Community Fees',
        component: CommunityFees,
        requiredRole: ['Manager', 'Basic Employee']
      },
      {
        id: 'commitments',
        label: 'Community Commitments',
        component: CommunityCommitments,
        requiredRole: ['Manager', 'Basic Employee']
      }
      // Future items will be added here:
      // { id: 'compliance', label: 'Compliance', component: Compliance },
      // { id: 'board', label: 'Board Information', component: BoardInfo }
    ]
  },
  {
    id: 'residents',
    label: 'Residents',
    icon: UserGroupIcon,
    requiredRole: ['Manager', 'Basic Employee', 'Resident'],
    items: [
      {
        id: 'resident-info',
        label: 'Resident Info',
        component: ResidentInfo,
        requiredRole: ['Manager', 'Basic Employee', 'Resident']
      }
      // Future items:
      // { id: 'properties', label: 'Properties', component: Properties },
    ]
  },
  {
    id: 'amenities',
    label: 'Amenities',
    icon: HomeIcon,
    requiredRole: ['Manager', 'Basic Employee', 'Resident'],
    items: [
      {
        id: 'amenities-info',
        label: 'Amenities',
        component: AmenitiesInfo,
        requiredRole: ['Manager', 'Basic Employee', 'Resident']
      }
      // Future items:
      // { id: 'facilities', label: 'Facilities', component: Facilities },
      // { id: 'reservations', label: 'Reservations', component: Reservations },
    ]
  },
  {
    id: 'community-storage',
    label: 'Community Storage',
    icon: FolderIcon,
    requiredRole: ['Manager', 'Basic Employee'],
    items: [
      {
        id: 'files',
        label: 'Files',
        component: FileBrowser,
        requiredRole: ['Manager', 'Basic Employee']
      }
      // Future items:
      // { id: 'documents', label: 'Documents', component: Documents },
      // { id: 'images', label: 'Images', component: Images },
    ]
  }
];

// Helper function to get all navigation items flattened
export const getAllNavigationItems = (): NavigationItem[] => {
  return navigationConfig.flatMap(section => section.items);
};

// Helper function to find a navigation item by ID
export const findNavigationItem = (itemId: string): NavigationItem | undefined => {
  for (const section of navigationConfig) {
    const item = section.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return undefined;
};

// Helper function to find a navigation section by ID
export const findNavigationSection = (sectionId: string): NavigationSection | undefined => {
  return navigationConfig.find(section => section.id === sectionId);
};

