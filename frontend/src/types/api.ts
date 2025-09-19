// API Response Types for HOA Nexus

// Base API Response Structure
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

// Generic API Response with Data
export interface ApiResponse<T> extends BaseApiResponse {
  data: T;
}

// Generic API Response with Optional Data
export interface ApiResponseOptional<T> extends BaseApiResponse {
  data?: T;
}

// Paginated API Response
export interface PaginatedApiResponse<T> extends BaseApiResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Count Response
export interface CountApiResponse extends BaseApiResponse {
  count: number;
}

// Error Response
export interface ErrorApiResponse extends BaseApiResponse {
  success: false;
  error: string;
  details?: unknown;
}

// Success Response
export interface SuccessApiResponse extends BaseApiResponse {
  success: true;
}

// Community API Responses
export interface CommunitiesApiResponse extends PaginatedApiResponse<import('./community').Community> {}
export interface CommunityApiResponse extends ApiResponse<import('./community').Community> {}

// Property API Responses
export interface PropertiesApiResponse extends PaginatedApiResponse<import('./property').Property> {}
export interface PropertyApiResponse extends ApiResponse<import('./property').Property> {}

// Stakeholder API Responses
export interface StakeholdersApiResponse extends PaginatedApiResponse<import('./stakeholder').Stakeholder> {}
export interface StakeholderApiResponse extends ApiResponse<import('./stakeholder').Stakeholder> {}

// Amenity API Responses
export interface AmenitiesApiResponse extends PaginatedApiResponse<import('./amenity').Amenity> {}
export interface AmenityApiResponse extends ApiResponse<import('./amenity').Amenity> {}

// Generic CRUD Response Types
export interface CreateResponse extends SuccessApiResponse {
  data: {
    id: number;
    message: string;
  };
}

export interface UpdateResponse extends SuccessApiResponse {
  data: {
    id: number;
    message: string;
    changes: Record<string, unknown>;
  };
}

export interface DeleteResponse extends SuccessApiResponse {
  data: {
    id: number;
    message: string;
  };
}

// Search Response
export interface SearchResponse<T> extends BaseApiResponse {
  data: T[];
  total: number;
  query: string;
  filters?: Record<string, unknown>;
}

// Bulk Operation Response
export interface BulkOperationResponse extends BaseApiResponse {
  data: {
    total: number;
    successful: number;
    failed: number;
    errors?: Array<{
      id: number;
      error: string;
    }>;
  };
}

// Export all types
export type {
  CommunitiesApiResponse,
  CommunityApiResponse,
  PropertiesApiResponse,
  PropertyApiResponse,
  StakeholdersApiResponse,
  StakeholderApiResponse,
  AmenitiesApiResponse,
  AmenityApiResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  SearchResponse,
  BulkOperationResponse,
};
