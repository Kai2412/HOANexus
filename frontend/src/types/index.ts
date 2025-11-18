// Re-export all types for easy importing
export * from './community';
export * from './property';
export * from './stakeholder';
export * from './amenity';
export * from './api';
export * from './reference';

// Legacy types for backward compatibility
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
