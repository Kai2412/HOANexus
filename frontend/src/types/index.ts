// Re-export all types for easy importing
export * from './community';
export * from './property';
export * from './stakeholder';
export * from './amenity';
export * from './managementFee';
export * from './billingInformation';
export * from './boardInformation';
export * from './feeMaster';
export * from './communityFeeVariance';
export * from './commitmentFees';
export * from './folder';
export * from './file';
export * from './invoice';
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
