/**
 * Centralized status color utility for consistent theming across components
 */

export type StatusColor = 'green' | 'yellow' | 'blue' | 'red' | 'purple' | 'orange' | 'gray';

export const statusColorClasses: Record<StatusColor, string> = {
  green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  orange: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
};

/**
 * Get status color classes for community status
 */
export const getCommunityStatusColor = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'active':
      return statusColorClasses.green;
    case 'inactive':
      return statusColorClasses.gray;
    case 'transition':
      return statusColorClasses.blue;
    case 'indevelopment':
      return statusColorClasses.orange;
    default:
      return statusColorClasses.gray;
  }
};

/**
 * Get status color classes for property status
 */
export const getPropertyStatusColor = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'occupied':
      return statusColorClasses.green;
    case 'vacant':
      return statusColorClasses.yellow;
    case 'forsale':
      return statusColorClasses.blue;
    case 'forrent':
      return statusColorClasses.purple;
    case 'underconstruction':
      return statusColorClasses.orange;
    default:
      return statusColorClasses.gray;
  }
};

/**
 * Get status color classes for community types
 */
export const getCommunityTypeColor = (type: string | undefined): string => {
  switch (type?.toLowerCase()) {
    case 'masterplanned':
      return statusColorClasses.blue;
    case 'singlefamily':
      return statusColorClasses.green;
    case 'townhome':
      return statusColorClasses.yellow;
    case 'condominium':
      return statusColorClasses.purple;
    case 'mixeduse':
      return statusColorClasses.orange;
    default:
      return statusColorClasses.gray;
  }
};

/**
 * Get just the color name for community status (for InfoRow chips)
 */
export const getCommunityStatusColorName = (status: string | undefined): StatusColor => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'green';
    case 'inactive':
      return 'gray';
    case 'transition':
      return 'blue';
    case 'indevelopment':
      return 'orange';
    default:
      return 'gray';
  }
};

/**
 * Get just the color name for community type (for InfoRow chips)
 */
export const getCommunityTypeColorName = (type: string | undefined): StatusColor => {
  switch (type?.toLowerCase()) {
    case 'masterplanned':
      return 'blue';
    case 'singlefamily':
      return 'green';
    case 'townhome':
      return 'yellow';
    case 'condominium':
      return 'purple';
    case 'mixeduse':
      return 'orange';
    default:
      return 'gray';
  }
};

/**
 * Get status color classes for general status (can be used for info chips, etc.)
 */
export const getGeneralStatusColor = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'approved':
    case 'occupied':
      return statusColorClasses.green;
    case 'pending':
    case 'in-progress':
    case 'vacant':
      return statusColorClasses.yellow;
    case 'inactive':
    case 'rejected':
    case 'cancelled':
      return statusColorClasses.red;
    case 'draft':
    case 'under-review':
      return statusColorClasses.blue;
    default:
      return statusColorClasses.gray;
  }
};
