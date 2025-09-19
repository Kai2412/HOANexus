// Centralized configuration for HOA Nexus Frontend
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  
  // App Configuration
  app: {
    name: 'HOA Nexus',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
    debug: import.meta.env.DEV || false,
  },
  
  // Feature Flags
  features: {
    darkMode: true,
    communitySelector: true,
    amenityReservations: true,
    realTimeUpdates: false, // Future feature
  },
  
  // UI Configuration
  ui: {
    themeTransitionDuration: 200, // milliseconds
    loadingSpinnerDelay: 300, // milliseconds
    toastDuration: 5000, // milliseconds
  },
  
  // Local Storage Keys
  storage: {
    selectedCommunity: 'hoa-nexus-selected-community',
    theme: 'hoa-nexus-theme',
    userPreferences: 'hoa-nexus-user-preferences',
  },
  
  // Error Messages
  errors: {
    networkError: 'Network error. Please check your connection and try again.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
    validationError: 'Please check your input and try again.',
  },
  
  // Success Messages
  success: {
    saved: 'Changes saved successfully.',
    created: 'Item created successfully.',
    updated: 'Item updated successfully.',
    deleted: 'Item deleted successfully.',
  },
} as const;

// Type-safe configuration access
export type Config = typeof config;

// Environment-specific overrides
if (config.app.environment === 'development') {
  // Note: Logger not available here yet, so we'll use console for config logging
  console.log('🔧 HOA Nexus Frontend Configuration:', config);
}

export default config;
