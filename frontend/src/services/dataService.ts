import api from './api';
import logger from './logger';
import type {
  Community,
  DatabaseCommunity,
  UpdateCommunityData,
  Property,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  CommunitiesApiResponse,
  CommunityApiResponse,
  StakeholdersApiResponse,
  StakeholderApiResponse,
  DynamicDropChoiceMap,
} from '../types';

class DataService {
  // ===== COMMUNITIES =====
  
  async getCommunities(): Promise<Community[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseCommunity[]; message?: string; count?: number }>('/communities');
      const communities = response.data ?? [];
      return communities.map((community) => this.mapCommunityFromDatabase(community));
    } catch (error) {
      logger.dataFetchError('communities', error as Error, 'DataService');
      throw error;
    }
  }

  async getCommunityById(id: string): Promise<Community> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseCommunity; message?: string }>(`/communities/${id}`);
      return this.mapCommunityFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError(`community ${id}`, error as Error, 'DataService');
      throw error;
    }
  }

  async createCommunity(communityData: UpdateCommunityData): Promise<Community> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseCommunity; message?: string }>(
        '/communities',
        communityData
      );
      return this.mapCommunityFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('create community', error as Error, 'DataService');
      throw error;
    }
  }

  async updateCommunity(id: string, communityData: UpdateCommunityData): Promise<Community> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseCommunity; message?: string }>(
        `/communities/${id}`,
        communityData
      );
      return this.mapCommunityFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating community ${id}`, 'DataService', { id, communityData }, error as Error);
      throw error;
    }
  }

  async deleteCommunity(_id: string): Promise<DeleteResponse> {
    throw new Error('deleteCommunity is not implemented in the new API surface yet.');
  }

  // Legacy helpers retained for compatibility but not yet implemented.
  async getSubAssociations(): Promise<CommunitiesApiResponse> {
    throw new Error('getSubAssociations is not implemented in the new API surface yet.');
  }

  async getParentCommunity(): Promise<CommunityApiResponse> {
    throw new Error('getParentCommunity is not implemented in the new API surface yet.');
  }

  // Temporarily disabled - using placeholder data in ResidentInfo component
  // Will be rebuilt when new property table is ready
  async getProperties(): Promise<Property[]> {
    throw new Error('getProperties is temporarily disabled. Using placeholder data until new property table is ready.');
  }

  async getStakeholdersByCommunity(): Promise<StakeholdersApiResponse> {
    throw new Error('getStakeholdersByCommunity is not implemented in the new API surface yet.');
  }

  async getDynamicDropChoices(groupIds: string[], includeInactive = false): Promise<DynamicDropChoiceMap> {
    if (!groupIds.length) {
      return {};
    }

    const params = new URLSearchParams();
    params.append('groupIds', groupIds.join(','));

    if (includeInactive) {
      params.append('includeInactive', 'true');
    }

    try {
      const response = await api.get<{ success: boolean; data: DynamicDropChoiceMap; message?: string }>(
        `/dynamic-drop-choices?${params.toString()}`
      );
      return response.data ?? {};
    } catch (error) {
      logger.dataFetchError('dynamic drop choices', error as Error, 'DataService');
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async getDynamicDropChoicesLegacy(tableName: string, columns: string[], includeInactive = false): Promise<DynamicDropChoiceMap> {
    if (!columns.length) {
      return {};
    }

    const params = new URLSearchParams({
      table: tableName,
      column: columns.join(',')
    });

    if (includeInactive) {
      params.append('includeInactive', 'true');
    }

    try {
      const response = await api.get<{ success: boolean; data: DynamicDropChoiceMap; message?: string }>(
        `/dynamic-drop-choices?${params.toString()}`
      );
      return response.data ?? {};
    } catch (error) {
      logger.dataFetchError('dynamic drop choices', error as Error, 'DataService');
      throw error;
    }
  }

  async createDynamicDropChoice(data: {
    groupId: string;
    choiceValue: string;
    displayOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<any> {
    try {
      const response = await api.post<{ success: boolean; data: any; message?: string }>(
        '/dynamic-drop-choices',
        data
      );
      return response.data;
    } catch (error) {
      logger.error('Error creating dynamic drop choice', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateDynamicDropChoice(choiceId: string, data: {
    choiceValue?: string;
    displayOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<any> {
    try {
      const response = await api.put<{ success: boolean; data: any; message?: string }>(
        `/dynamic-drop-choices/${choiceId}`,
        data
      );
      return response.data;
    } catch (error) {
      logger.error(`Error updating dynamic drop choice ${choiceId}`, 'DataService', { choiceId, data }, error as Error);
      throw error;
    }
  }

  async toggleDynamicDropChoiceActive(choiceId: string, isActive: boolean): Promise<any> {
    try {
      const response = await api.put<{ success: boolean; data: any; message?: string }>(
        `/dynamic-drop-choices/${choiceId}/toggle-active`,
        { isActive }
      );
      return response.data;
    } catch (error) {
      logger.error(`Error toggling active status for dynamic drop choice ${choiceId}`, 'DataService', { choiceId, isActive }, error as Error);
      throw error;
    }
  }

  async bulkUpdateChoiceOrder(groupId: string, choices: Array<{ choiceId: string }>): Promise<void> {
    try {
      await api.post<{ success: boolean; message?: string }>(
        '/dynamic-drop-choices/bulk-update-order',
        { groupId, choices }
      );
    } catch (error) {
      logger.error('Error updating choice order', 'DataService', { groupId, choices }, error as Error);
      throw error;
    }
  }

  private mapCommunityFromDatabase(community: DatabaseCommunity): Community {
    const mapped: Community = {
      id: community.CommunityID,
      propertyCode: community.PropertyCode ?? null,
      displayName: community.DisplayName ?? null,
      legalName: community.LegalName ?? null,
      active: community.Active ?? null,
      contractStart: community.ContractStart ?? null,
      contractEnd: community.ContractEnd ?? null,
      addressLine1: community.Address ?? null,
      addressLine2: community.Address2 ?? null,
      city: community.City ?? null,
      state: community.State ?? null,
      postalCode: community.Zipcode ?? null,
      thirdPartyIdentifier: community.ThirdPartyIdentifier ?? null,
      market: community.Market ?? null,
      office: community.Office ?? null,
      website: community.Website ?? null,
      taxId: community.TaxID ?? null,
      stateTaxId: community.StateTaxID ?? null,
      sosFileNumber: community.SOSFileNumber ?? null,
      taxReturnType: community.TaxReturnType ?? null,
      clientType: community.ClientType ?? null,
      serviceType: community.ServiceType ?? null,
      managementType: community.ManagementType ?? null,
      builtOutUnits: community.BuiltOutUnits ?? null,
      developmentStage: community.DevelopmentStage ?? null,
      communityStatus: community.CommunityStatus ?? null,
      acquisitionType: community.AcquisitionType ?? null,
      preferredContactInfo: community.PreferredContactInfo ?? null,
      createdOn: community.CreatedOn ?? null,
      createdBy: community.CreatedBy ?? null,
      createdByName: community.CreatedByName ?? null,
      modifiedOn: community.ModifiedOn ?? null,
      modifiedBy: community.ModifiedBy ?? null,
      modifiedByName: community.ModifiedByName ?? null,
      original: community
    };

    // Derived compatibility fields for existing components (to be refactored)
    mapped.status = mapped.communityStatus ?? (mapped.active ? 'Active' : 'Inactive');
    mapped.name = mapped.displayName ?? mapped.legalName ?? mapped.propertyCode ?? null;
    mapped.pcode = mapped.propertyCode ?? null;
    mapped.units = mapped.builtOutUnits ?? null;

    return mapped;
  }
}

export default new DataService();
