import api from './api';
import logger from './logger';
import type {
  Community,
  DatabaseCommunity,
  CreateCommunityData,
  UpdateCommunityData,
  Property,
  DatabaseProperty,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  CommunitiesApiResponse,
  CommunityApiResponse,
  PropertiesApiResponse,
  PropertyApiResponse,
  StakeholdersApiResponse,
  StakeholderApiResponse,
} from '../types';

class DataService {
  // ===== COMMUNITIES =====
  
  async getCommunities(): Promise<Community[]> {
    try {
      const response = await api.get<{success: boolean, data: DatabaseCommunity[], message?: string, count?: number}>('/communities');
      const communities = response.data || [];
      
      // Map database fields to component-expected fields
      return communities.map((community: DatabaseCommunity) => this.mapCommunityFromDatabase(community));
    } catch (error) {
      logger.dataFetchError('communities', error as Error, 'DataService');
      throw error;
    }
  }

  async getCommunityById(id: number): Promise<Community> {
    try {
      const response = await api.get<{success: boolean, data: DatabaseCommunity, message?: string}>(`/communities/${id}`);
      const community = response.data;
      
      // Apply same mapping for single community
      return this.mapCommunityFromDatabase(community);
    } catch (error) {
      logger.dataFetchError(`community ${id}`, error as Error, 'DataService');
      throw error;
    }
  }

  async getCommunityByPcode(pcode: string): Promise<Community> {
    try {
      const response = await api.get<{success: boolean, data: DatabaseCommunity, message?: string}>(`/communities/pcode/${pcode}`);
      const community = response.data;
      
      // Apply same mapping
      return this.mapCommunityFromDatabase(community);
    } catch (error) {
      logger.dataFetchError(`community with pcode ${pcode}`, error as Error, 'DataService');
      throw error;
    }
  }

  async createCommunity(communityData: CreateCommunityData): Promise<CreateResponse> {
    try {
      const response = await api.post<CreateResponse>('/communities', communityData);
      return response;
    } catch (error) {
      logger.error('Error creating community', 'DataService', { communityData }, error as Error);
      throw error;
    }
  }

  async updateCommunity(id: number, communityData: UpdateCommunityData): Promise<UpdateResponse> {
    try {
      const response = await api.put<UpdateResponse>(`/communities/${id}`, communityData);
      return response;
    } catch (error) {
      logger.error(`Error updating community ${id}`, 'DataService', { id, communityData }, error as Error);
      throw error;
    }
  }

  async deleteCommunity(id: number): Promise<DeleteResponse> {
    try {
      const response = await api.delete<DeleteResponse>(`/communities/${id}`);
      return response;
    } catch (error) {
      logger.error(`Error deleting community ${id}`, 'DataService', { id }, error as Error);
      throw error;
    }
  }

  // ===== MASTER ASSOCIATIONS / SUB-ASSOCIATIONS =====

  async getSubAssociations(parentCommunityId: number): Promise<CommunitiesApiResponse> {
    try {
      const response = await api.get<CommunitiesApiResponse>(`/communities/${parentCommunityId}/sub-associations`);
      return response;
    } catch (error) {
      logger.dataFetchError(`sub-associations for community ${parentCommunityId}`, error as Error, 'DataService');
      throw error;
    }
  }

  async getParentCommunity(communityId: number): Promise<CommunityApiResponse> {
    try {
      const response = await api.get<CommunityApiResponse>(`/communities/${communityId}/parent`);
      return response;
    } catch (error) {
      logger.dataFetchError(`parent community for ${communityId}`, error as Error, 'DataService');
      throw error;
    }
  }

  // ===== PROPERTIES =====
  
  async getProperties(communityId: number): Promise<Property[]> {
    try {
      logger.debug(`Fetching properties for community: ${communityId}`, 'DataService');
      const response = await api.get<{success: boolean, data: DatabaseProperty[], message?: string, count?: number}>(`/properties/community/${communityId}`);
      const properties = response.data || [];
      
      // Normalize property data
      return properties.map((property: DatabaseProperty) => this.mapPropertyFromDatabase(property));
    } catch (error) {
      logger.dataFetchError('properties', error as Error, 'DataService');
      throw error;
    }
  }

  // ===== FUTURE ENDPOINTS =====

  async getStakeholdersByCommunity(communityId: number): Promise<StakeholdersApiResponse> {
    try {
      const response = await api.get<StakeholdersApiResponse>(`/communities/${communityId}/stakeholders`);
      return response;
    } catch (error) {
      logger.dataFetchError(`stakeholders for community ${communityId}`, error as Error, 'DataService');
      throw error;
    }
  }

  // ===== PRIVATE MAPPING METHODS =====

  private mapCommunityFromDatabase(community: DatabaseCommunity): Community {
    return {
      // Normalized fields for frontend components
      id: community.ID,
      pcode: community.Pcode,
      name: community.Name || community.DisplayName,
      displayName: community.DisplayName,
      legalName: community.Name, // Map Name to legalName for UI display
      communityType: community.CommunityType,
      status: community.Status || 'Active',
      units: community.PropertyCount ?? 0,
      formationDate: community.FormationDate,
      fiscalYearStart: community.FiscalYearStart,
      fiscalYearEnd: community.FiscalYearEnd,
      contractStartDate: community.ContractStartDate,
      contractEndDate: community.ContractEndDate,
      taxId: community.TaxID,
      timeZone: community.TimeZone,
      state: community.State,
      city: community.City,
      addressLine1: community.AddressLine1,
      addressLine2: community.AddressLine2,
      postalCode: community.PostalCode,
      country: community.Country,
      masterAssociation: community.MasterAssociation,
      lastUpdated: community.LastUpdated,
      createdDate: community.CreatedDate,
      isSubAssociation: community.IsSubAssociation,
      lastAuditDate: community.LastAuditDate,
      nextAuditDate: community.NextAuditDate,
      dataCompleteness: community.DataCompleteness,
      isActive: community.IsActive,
      
      // Keep original database fields too (for debugging/future use)
      original: community
    };
  }

  private mapPropertyFromDatabase(property: DatabaseProperty): Property {
    return {
      id: property.ID,
      communityId: property.CommunityID,
      addressLine1: property.AddressLine1,
      addressLine2: property.AddressLine2,
      city: property.City,
      state: property.State,
      postalCode: property.PostalCode,
      country: property.Country,
      propertyType: property.PropertyType,
      squareFootage: property.SquareFootage,
      bedrooms: property.Bedrooms,
      bathrooms: property.Bathrooms,
      yearBuilt: property.YearBuilt,
      lotSize: property.LotSize,
      parcelId: property.ParcelID,
      assessmentPercentage: property.AssessmentPercentage,
      isActiveDevelopment: property.IsActiveDevelopment,
      votingInterest: property.VotingInterest,
      status: property.Status,
      isActive: property.IsActive
    };
  }
}

export default new DataService();
