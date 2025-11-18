// Amenity API service functions
// Temporarily disabled - using placeholder data in AmenitiesInfo component
// Will be rebuilt when new amenity table is ready
import api from './api';
import type {
  AmenitiesResponse,
  AmenityResponse,
  AmenityTypesResponse,
  StatusTypesResponse,
  CreateAmenityRequest,
  UpdateAmenityRequest,
  AmenityFilters
} from '../types';

export const amenityService = {
  /**
   * Get all amenities for a community with optional filtering and pagination
   * Temporarily disabled - using placeholder data until new amenity table is ready
   */
  async getAmenities(communityId: number, filters: AmenityFilters = {}): Promise<AmenitiesResponse> {
    throw new Error('getAmenities is temporarily disabled. Using placeholder data until new amenity table is ready.');
  },

  /**
   * Get a single amenity by ID with full details
   */
  async getAmenityById(amenityId: number): Promise<AmenityResponse> {
    return api.get(`/amenities/amenity/${amenityId}`);
  },

  /**
   * Create a new amenity
   */
  async createAmenity(communityId: number, amenityData: CreateAmenityRequest): Promise<{ success: boolean; data: { amenityId: number } }> {
    return api.post(`/amenities/${communityId}/amenities`, amenityData);
  },

  /**
   * Update an existing amenity
   */
  async updateAmenity(amenityId: number, amenityData: UpdateAmenityRequest): Promise<{ success: boolean; message: string }> {
    return api.put(`/amenities/amenity/${amenityId}`, amenityData);
  },

  /**
   * Delete an amenity (soft delete)
   */
  async deleteAmenity(amenityId: number): Promise<{ success: boolean; message: string }> {
    return api.delete(`/amenities/amenity/${amenityId}`);
  },

  /**
   * Get available amenity types from configuration
   */
  async getAmenityTypes(): Promise<AmenityTypesResponse> {
    return api.get('/amenities/config/types');
  },

  /**
   * Get available status types from configuration  
   */
  async getStatusTypes(): Promise<StatusTypesResponse> {
    return api.get('/amenities/config/statuses');
  }
};

export default amenityService;
