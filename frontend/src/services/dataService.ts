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
  ManagementFee,
  DatabaseManagementFee,
  CreateManagementFeeData,
  UpdateManagementFeeData,
  BillingInformation,
  DatabaseBillingInformation,
  CreateBillingInformationData,
  UpdateBillingInformationData,
  BoardInformation,
  DatabaseBoardInformation,
  CreateBoardInformationData,
  UpdateBoardInformationData,
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
    } catch (error: any) {
      // Extract better error message
      const errorMessage = error?.errorData?.message || error?.errorData?.error || error?.message || 'Failed to update community';
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = error?.status;
      (enhancedError as any).response = error?.response;
      logger.error(`Error updating community ${id}`, 'DataService', { id, communityData }, enhancedError as Error);
      throw enhancedError;
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

  // ===== MANAGEMENT FEES =====

  async getManagementFeeByCommunity(communityId: string): Promise<ManagementFee | null> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseManagementFee | null; message?: string }>(
        `/management-fees/community/${communityId}`
      );
      if (!response.data) {
        return null;
      }
      return this.mapManagementFeeFromDatabase(response.data);
    } catch (error) {
      // 404 means no management fee exists yet - return null
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      logger.dataFetchError('management fee by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getManagementFeeById(id: string): Promise<ManagementFee> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseManagementFee; message?: string }>(
        `/management-fees/${id}`
      );
      return this.mapManagementFeeFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('management fee by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createManagementFee(data: CreateManagementFeeData): Promise<ManagementFee> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseManagementFee; message?: string }>(
        '/management-fees',
        data
      );
      return this.mapManagementFeeFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating management fee', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateManagementFee(id: string, data: UpdateManagementFeeData): Promise<ManagementFee> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseManagementFee; message?: string }>(
        `/management-fees/${id}`,
        data
      );
      return this.mapManagementFeeFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating management fee ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  private mapManagementFeeFromDatabase(db: DatabaseManagementFee): ManagementFee {
    return {
      id: db.ManagementFeesID,
      communityId: db.CommunityID,
      managementFee: db.ManagementFee,
      perUnitFee: db.PerUnitFee,
      feeType: db.FeeType,
      increaseType: db.IncreaseType,
      increaseEffective: db.IncreaseEffective,
      boardApprovalRequired: db.BoardApprovalRequired,
      autoIncrease: db.AutoIncrease,
      fixedCost: db.FixedCost,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
      isActive: db.IsActive
    };
  }

  // ===== BILLING INFORMATION =====

  async getBillingInformationByCommunity(communityId: string): Promise<BillingInformation | null> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseBillingInformation | null; message?: string }>(
        `/billing-information/community/${communityId}`
      );
      if (!response.data) {
        return null;
      }
      return this.mapBillingInformationFromDatabase(response.data);
    } catch (error) {
      // 404 means no billing information exists yet - return null
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      logger.dataFetchError('billing information by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getBillingInformationById(id: string): Promise<BillingInformation> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseBillingInformation; message?: string }>(
        `/billing-information/${id}`
      );
      return this.mapBillingInformationFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('billing information by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createBillingInformation(data: CreateBillingInformationData): Promise<BillingInformation> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseBillingInformation; message?: string }>(
        '/billing-information',
        data
      );
      return this.mapBillingInformationFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating billing information', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateBillingInformation(id: string, data: UpdateBillingInformationData): Promise<BillingInformation> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseBillingInformation; message?: string }>(
        `/billing-information/${id}`,
        data
      );
      return this.mapBillingInformationFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating billing information ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  private mapBillingInformationFromDatabase(db: DatabaseBillingInformation): BillingInformation {
    return {
      id: db.BillingInformationID,
      communityId: db.CommunityID,
      billingFrequency: db.BillingFrequency,
      billingMonth: db.BillingMonth,
      billingDay: db.BillingDay,
      noticeRequirement: db.NoticeRequirement,
      coupon: db.Coupon,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
      isActive: db.IsActive
    };
  }

  async getBoardInformationByCommunity(communityId: string): Promise<BoardInformation | null> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseBoardInformation | null; message?: string }>(
        `/board-information/community/${communityId}`
      );
      if (!response.data) {
        return null;
      }
      return this.mapBoardInformationFromDatabase(response.data);
    } catch (error) {
      // 404 means no board information exists yet - return null
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      logger.dataFetchError('board information by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getBoardInformationById(id: string): Promise<BoardInformation> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseBoardInformation; message?: string }>(
        `/board-information/${id}`
      );
      return this.mapBoardInformationFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('board information by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createBoardInformation(data: CreateBoardInformationData): Promise<BoardInformation> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseBoardInformation; message?: string }>(
        '/board-information',
        data
      );
      return this.mapBoardInformationFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating board information', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateBoardInformation(id: string, data: UpdateBoardInformationData): Promise<BoardInformation> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseBoardInformation; message?: string }>(
        `/board-information/${id}`,
        data
      );
      return this.mapBoardInformationFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating board information ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  private mapBoardInformationFromDatabase(db: DatabaseBoardInformation): BoardInformation {
    return {
      id: db.BoardInformationID,
      communityId: db.CommunityID,
      annualMeetingFrequency: db.AnnualMeetingFrequency,
      regularMeetingFrequency: db.RegularMeetingFrequency,
      boardMembersRequired: db.BoardMembersRequired,
      quorum: db.Quorum,
      termLimits: db.TermLimits,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
      isActive: db.IsActive
    };
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

  // ===== BULK UPLOAD =====

  async downloadCommunitiesTemplate(): Promise<Blob> {
    try {
      const blob = await api.get<Blob>('/admin/bulk-upload/communities/template', {
        responseType: 'blob'
      });
      return blob;
    } catch (error) {
      logger.dataFetchError('download communities template', error as Error, 'DataService');
      throw error;
    }
  }

  async validateCommunitiesCSV(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Don't set Content-Type header - browser will set it automatically with boundary
      const response = await api.post<{ success: boolean; data: any; message?: string; error?: string }>(
        '/admin/bulk-upload/communities/validate',
        formData
      );
      return response;
    } catch (error: any) {
      // Re-throw with more context
      const enhancedError = new Error(error.message || 'Failed to validate CSV');
      (enhancedError as any).status = error.status;
      (enhancedError as any).originalError = error;
      logger.dataFetchError('validate communities CSV', enhancedError as Error, 'DataService');
      throw enhancedError;
    }
  }

  async importCommunities(rows: any[], duplicateAction: 'skip' | 'update' | 'import' = 'update'): Promise<any> {
    try {
      const response = await api.post<{ success: boolean; data: any; message?: string }>(
        '/admin/bulk-upload/communities/import',
        { rows, duplicateAction }
      );
      return response;
    } catch (error) {
      logger.dataFetchError('import communities', error as Error, 'DataService');
      throw error;
    }
  }
}

export default new DataService();
