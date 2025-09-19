// Amenity API service functions
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
   */
  async getAmenities(communityId: number, filters: AmenityFilters = {}): Promise<AmenitiesResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = `/amenities/${communityId}/amenities${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url);
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
