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
  FeeMaster,
  DatabaseFeeMaster,
  CreateFeeMasterData,
  UpdateFeeMasterData,
  FeeOrder,
  CommunityFeeVariance,
  DatabaseCommunityFeeVariance,
  CreateCommunityFeeVarianceData,
  UpdateCommunityFeeVarianceData,
  CommitmentFee,
  DatabaseCommitmentFee,
  CreateCommitmentFeeData,
  UpdateCommitmentFeeData,
  Folder,
  DatabaseFolder,
  CreateFolderData,
  UpdateFolderData,
  File,
  DatabaseFile,
  UploadFileData,
  UpdateFileData,
  Invoice,
  DatabaseInvoice,
  DatabaseInvoiceCharge,
  CreateInvoiceData,
  InvoiceFeeData,
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

  // ===== FEE MASTER =====

  async getAllFeeMasters(): Promise<FeeMaster[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFeeMaster[]; message?: string }>(
        '/fee-master'
      );
      return (response.data || []).map((fee) => this.mapFeeMasterFromDatabase(fee));
    } catch (error) {
      logger.dataFetchError('fee masters', error as Error, 'DataService');
      throw error;
    }
  }

  async getFeeMasterById(id: string): Promise<FeeMaster> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFeeMaster; message?: string }>(
        `/fee-master/${id}`
      );
      return this.mapFeeMasterFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('fee master by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createFeeMaster(data: CreateFeeMasterData): Promise<FeeMaster> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseFeeMaster; message?: string }>(
        '/fee-master',
        data
      );
      return this.mapFeeMasterFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating fee master', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateFeeMaster(id: string, data: UpdateFeeMasterData): Promise<FeeMaster> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseFeeMaster; message?: string }>(
        `/fee-master/${id}`,
        data
      );
      return this.mapFeeMasterFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating fee master ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  async deleteFeeMaster(id: string): Promise<void> {
    try {
      await api.delete<{ success: boolean; message?: string }>(`/fee-master/${id}`);
    } catch (error) {
      logger.error(`Error deleting fee master ${id}`, 'DataService', { id }, error as Error);
      throw error;
    }
  }

  async bulkUpdateFeeOrder(feeOrders: FeeOrder[]): Promise<void> {
    try {
      await api.put<{ success: boolean; message?: string }>(
        '/fee-master/order/bulk',
        { feeOrders }
      );
    } catch (error) {
      logger.error('Error updating fee order', 'DataService', { feeOrders }, error as Error);
      throw error;
    }
  }

  private mapFeeMasterFromDatabase(db: DatabaseFeeMaster): FeeMaster {
    return {
      id: db.FeeMasterID,
      feeName: db.FeeName,
      defaultAmount: db.DefaultAmount,
      displayOrder: db.DisplayOrder,
      isActive: db.IsActive,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy
    };
  }

  // ===== COMMUNITY FEE VARIANCES =====

  async getCommunityFeeVariancesByCommunity(communityId: string): Promise<CommunityFeeVariance[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseCommunityFeeVariance[]; message?: string }>(
        `/community-fee-variances/community/${communityId}`
      );
      return (response.data || []).map((variance) => this.mapCommunityFeeVarianceFromDatabase(variance));
    } catch (error) {
      // 404 means no variances exist yet - return empty array
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('community fee variances by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getCommunityFeeVarianceById(id: string): Promise<CommunityFeeVariance> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseCommunityFeeVariance; message?: string }>(
        `/community-fee-variances/${id}`
      );
      return this.mapCommunityFeeVarianceFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('community fee variance by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createCommunityFeeVariance(data: CreateCommunityFeeVarianceData): Promise<CommunityFeeVariance> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseCommunityFeeVariance; message?: string }>(
        '/community-fee-variances',
        data
      );
      return this.mapCommunityFeeVarianceFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating community fee variance', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateCommunityFeeVariance(id: string, data: UpdateCommunityFeeVarianceData): Promise<CommunityFeeVariance> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseCommunityFeeVariance; message?: string }>(
        `/community-fee-variances/${id}`,
        data
      );
      return this.mapCommunityFeeVarianceFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating community fee variance ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  async deleteCommunityFeeVariance(id: string): Promise<void> {
    try {
      await api.delete<{ success: boolean; message?: string }>(`/community-fee-variances/${id}`);
    } catch (error) {
      logger.error(`Error deleting community fee variance ${id}`, 'DataService', { id }, error as Error);
      throw error;
    }
  }

  private mapCommunityFeeVarianceFromDatabase(db: DatabaseCommunityFeeVariance): CommunityFeeVariance {
    return {
      id: db.CommunityFeeVarianceID,
      communityId: db.CommunityID,
      feeMasterId: db.FeeMasterID,
      varianceType: db.VarianceType,
      customAmount: db.CustomAmount,
      notes: db.Notes,
      isActive: db.IsActive,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
      feeName: db.FeeName,
      defaultAmount: db.DefaultAmount,
      feeDisplayOrder: db.FeeDisplayOrder
    };
  }

  // ===== COMMITMENT FEES =====

  async getCommitmentFeesByCommunity(communityId: string): Promise<CommitmentFee[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseCommitmentFee[]; message?: string }>(
        `/commitment-fees/community/${communityId}`
      );
      return (response.data || []).map((fee) => this.mapCommitmentFeeFromDatabase(fee));
    } catch (error) {
      // 404 means no commitment fees exist yet - return empty array
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('commitment fees by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getCommitmentFeeById(id: string): Promise<CommitmentFee> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseCommitmentFee; message?: string }>(
        `/commitment-fees/${id}`
      );
      return this.mapCommitmentFeeFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('commitment fee by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createCommitmentFee(data: CreateCommitmentFeeData): Promise<CommitmentFee> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseCommitmentFee; message?: string }>(
        '/commitment-fees',
        data
      );
      return this.mapCommitmentFeeFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating commitment fee', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateCommitmentFee(id: string, data: UpdateCommitmentFeeData): Promise<CommitmentFee> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseCommitmentFee; message?: string }>(
        `/commitment-fees/${id}`,
        data
      );
      return this.mapCommitmentFeeFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating commitment fee ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  async deleteCommitmentFee(id: string): Promise<void> {
    try {
      await api.delete<{ success: boolean; message?: string }>(`/commitment-fees/${id}`);
    } catch (error) {
      logger.error(`Error deleting commitment fee ${id}`, 'DataService', { id }, error as Error);
      throw error;
    }
  }

  private mapCommitmentFeeFromDatabase(db: DatabaseCommitmentFee): CommitmentFee {
    return {
      id: db.CommitmentFeeID,
      communityId: db.CommunityID,
      commitmentTypeId: db.CommitmentTypeID,
      entryType: db.EntryType,
      feeName: db.FeeName,
      value: db.Value !== null && db.Value !== undefined ? parseFloat(db.Value.toString()) : null,
      notes: db.Notes,
      isActive: db.IsActive,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
      commitmentTypeName: db.CommitmentTypeName,
      commitmentTypeDisplayOrder: db.CommitmentTypeDisplayOrder
    };
  }

  // ===== FOLDERS =====

  async getFoldersByCommunity(communityId: string): Promise<Folder[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFolder[]; message?: string; count?: number }>(
        `/folders/community/${communityId}`
      );
      return (response.data || []).map((folder) => this.mapFolderFromDatabase(folder));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('folders by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getFolderTreeByCommunity(communityId: string): Promise<Folder[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFolder[]; message?: string }>(
        `/folders/community/${communityId}/tree`
      );
      return (response.data || []).map((folder) => this.mapFolderTreeFromDatabase(folder));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('folder tree by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getFolderById(id: string): Promise<Folder> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFolder; message?: string }>(
        `/folders/${id}`
      );
      return this.mapFolderFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('folder by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async createFolder(data: CreateFolderData): Promise<Folder> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseFolder; message?: string }>(
        '/folders',
        data
      );
      return this.mapFolderFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating folder', 'DataService', data, error as Error);
      throw error;
    }
  }

  async updateFolder(id: string, data: UpdateFolderData): Promise<Folder> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseFolder; message?: string }>(
        `/folders/${id}`,
        data
      );
      return this.mapFolderFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating folder ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  async deleteFolder(id: string): Promise<void> {
    try {
      await api.delete<{ success: boolean; message?: string }>(`/folders/${id}`);
    } catch (error) {
      logger.error(`Error deleting folder ${id}`, 'DataService', { id }, error as Error);
      throw error;
    }
  }

  // Corporate folders
  async getCorporateFolders(): Promise<Folder[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFolder[]; message?: string; count?: number }>(
        '/folders/corporate'
      );
      return (response.data || []).map((folder) => this.mapFolderFromDatabase(folder));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('corporate folders', error as Error, 'DataService');
      throw error;
    }
  }

  async getCorporateFolderTree(): Promise<Folder[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFolder[]; message?: string }>(
        '/folders/corporate/tree'
      );
      return (response.data || []).map((folder) => this.mapFolderTreeFromDatabase(folder));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('corporate folder tree', error as Error, 'DataService');
      throw error;
    }
  }

  private mapFolderFromDatabase(db: DatabaseFolder): Folder {
    return {
      id: db.FolderID,
      communityId: db.CommunityID,
      parentFolderId: db.ParentFolderID,
      name: db.FolderName,
      path: db.FolderPath,
      displayOrder: db.DisplayOrder,
      isActive: db.IsActive,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
    };
  }

  private mapFolderTreeFromDatabase(db: DatabaseFolder & { children?: DatabaseFolder[] }): Folder {
    const folder = this.mapFolderFromDatabase(db);
    if (db.children && Array.isArray(db.children)) {
      folder.children = db.children.map((child) => this.mapFolderTreeFromDatabase(child));
    }
    return folder;
  }

  // ===== FILES =====

  async getFilesByCommunity(communityId: string): Promise<File[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFile[]; message?: string; count?: number }>(
        `/files/community/${communityId}`
      );
      return (response.data || []).map((file) => this.mapFileFromDatabase(file));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('files by community', error as Error, 'DataService');
      throw error;
    }
  }

  async getFilesByFolder(folderId: string | null, communityId: string): Promise<File[]> {
    try {
      // Use "root" for null folderId to get root-level files only
      const folderParam = folderId || 'root';
      const endpoint = `/files/folder/${folderParam}/community/${communityId}`;
      const response = await api.get<{ success: boolean; data: DatabaseFile[]; message?: string; count?: number }>(
        endpoint
      );
      return (response.data || []).map((file) => this.mapFileFromDatabase(file));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('files by folder', error as Error, 'DataService');
      throw error;
    }
  }

  async getFileById(id: string): Promise<File> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseFile; message?: string }>(
        `/files/${id}`
      );
      return this.mapFileFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('file by ID', error as Error, 'DataService');
      throw error;
    }
  }

  async uploadFile(data: UploadFileData): Promise<File> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('CommunityID', data.CommunityID);
      // Always append FolderID - send empty string if null so backend knows it's explicitly null
      formData.append('FolderID', data.FolderID || '');
      if (data.FileType) {
        formData.append('FileType', data.FileType);
      }

      // Don't set Content-Type header - browser will set it automatically with boundary for FormData
      const response = await api.post<{ success: boolean; data: DatabaseFile; message?: string }>(
        '/files/upload',
        formData
      );
      return this.mapFileFromDatabase(response.data);
    } catch (error) {
      logger.error('Error uploading file', 'DataService', { fileName: data.file.name }, error as Error);
      throw error;
    }
  }

  async downloadFile(id: string): Promise<Blob> {
    try {
      const blob = await api.get<Blob>(`/files/${id}/download`, {
        responseType: 'blob'
      });
      return blob;
    } catch (error) {
      logger.dataFetchError('download file', error as Error, 'DataService');
      throw error;
    }
  }

  async updateFile(id: string, data: UpdateFileData): Promise<File> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseFile; message?: string }>(
        `/files/${id}`,
        data
      );
      return this.mapFileFromDatabase(response.data);
    } catch (error) {
      logger.error(`Error updating file ${id}`, 'DataService', { id, data }, error as Error);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      await api.delete<{ success: boolean; message?: string }>(`/files/${id}`);
    } catch (error) {
      logger.error(`Error deleting file ${id}`, 'DataService', { id }, error as Error);
      throw error;
    }
  }

  // Corporate files
  async getCorporateFilesByFolder(folderId: string | null): Promise<File[]> {
    try {
      // Use "root" for null folderId to get root-level files only
      const folderParam = folderId || 'root';
      const endpoint = `/files/corporate/folder/${folderParam}`;
      const response = await api.get<{ success: boolean; data: DatabaseFile[]; message?: string; count?: number }>(
        endpoint
      );
      return (response.data || []).map((file) => this.mapFileFromDatabase(file));
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return [];
      }
      logger.dataFetchError('corporate files by folder', error as Error, 'DataService');
      throw error;
    }
  }

  private mapFileFromDatabase(db: DatabaseFile): File {
    return {
      id: db.FileID,
      folderId: db.FolderID,
      communityId: db.CommunityID,
      fileName: db.FileName,
      fileNameStored: db.FileNameStored,
      filePath: db.FilePath,
      fileSize: db.FileSize,
      mimeType: db.MimeType,
      fileType: db.FileType,
      isActive: db.IsActive,
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn,
      modifiedBy: db.ModifiedBy,
    };
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

  // =============================================
  // INVOICE METHODS
  // =============================================

  /**
   * Map database invoice to frontend format
   */
  private mapInvoiceFromDatabase(db: DatabaseInvoice & { Charges?: DatabaseInvoiceCharge[] }): Invoice {
    return {
      id: db.InvoiceID,
      communityId: db.CommunityID,
      invoiceNumber: db.InvoiceNumber,
      invoiceDate: db.InvoiceDate,
      total: db.Total,
      status: db.Status,
      fileId: db.FileID,
      charges: (db.Charges || []).map(c => ({
        id: c.InvoiceChargeID,
        invoiceId: c.InvoiceID,
        description: c.Description,
        amount: c.Amount,
        displayOrder: c.DisplayOrder,
        createdOn: c.CreatedOn,
        createdBy: c.CreatedBy,
      })),
      createdOn: db.CreatedOn,
      createdBy: db.CreatedBy,
      modifiedOn: db.ModifiedOn || null,
      modifiedBy: db.ModifiedBy || null,
    };
  }

  /**
   * Get all fees for a community (for invoice generation)
   */
  async getFeesForCommunity(communityId: string): Promise<InvoiceFeeData> {
    try {
      const response = await api.get<{ success: boolean; data: InvoiceFeeData; message?: string }>(
        `/invoices/fees/community/${communityId}`
      );
      return response.data;
    } catch (error) {
      logger.dataFetchError('fees for community', error as Error, 'DataService');
      throw error;
    }
  }

  /**
   * Get next invoice number
   */
  async getNextInvoiceNumber(): Promise<string> {
    try {
      const response = await api.get<{ success: boolean; data: { invoiceNumber: string }; message?: string }>(
        '/invoices/next-number'
      );
      return response.data.invoiceNumber;
    } catch (error) {
      logger.dataFetchError('next invoice number', error as Error, 'DataService');
      throw error;
    }
  }

  /**
   * Get all invoices for a community
   */
  async getInvoicesByCommunity(communityId: string): Promise<Invoice[]> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseInvoice[]; message?: string; count?: number }>(
        `/invoices/community/${communityId}`
      );
      return (response.data || []).map((inv) => this.mapInvoiceFromDatabase(inv));
    } catch (error) {
      logger.dataFetchError('invoices by community', error as Error, 'DataService');
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await api.get<{ success: boolean; data: DatabaseInvoice & { Charges: DatabaseInvoiceCharge[] }; message?: string }>(
        `/invoices/${id}`
      );
      return this.mapInvoiceFromDatabase(response.data);
    } catch (error) {
      logger.dataFetchError('invoice by ID', error as Error, 'DataService');
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      const response = await api.post<{ success: boolean; data: DatabaseInvoice & { Charges: DatabaseInvoiceCharge[] }; message?: string }>(
        '/invoices',
        data
      );
      return this.mapInvoiceFromDatabase(response.data);
    } catch (error) {
      logger.error('Error creating invoice', 'DataService', data, error as Error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id: string, status: string, modifiedBy?: string | null): Promise<Invoice> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseInvoice & { Charges: DatabaseInvoiceCharge[] }; message?: string }>(
        `/invoices/${id}/status`,
        { Status: status, ModifiedBy: modifiedBy || null }
      );
      return this.mapInvoiceFromDatabase(response.data);
    } catch (error) {
      logger.error('Error updating invoice status', 'DataService', { id, status }, error as Error);
      throw error;
    }
  }

  /**
   * Update invoice file link
   */
  async updateInvoiceFileLink(id: string, fileId: string): Promise<Invoice> {
    try {
      const response = await api.put<{ success: boolean; data: DatabaseInvoice & { Charges: DatabaseInvoiceCharge[] }; message?: string }>(
        `/invoices/${id}/file`,
        { FileID: fileId }
      );
      return this.mapInvoiceFromDatabase(response.data);
    } catch (error) {
      logger.error('Error updating invoice file link', 'DataService', { id, fileId }, error as Error);
      throw error;
    }
  }

  /**
   * Generate invoice PDF (without creating database records)
   */
  async generateInvoicePDF(communityId: string, invoiceNumber: string, invoiceDate: string, charges: Array<{ Description: string; Amount: number }>, total: number): Promise<{ fileId: string; fileName: string; fileUrl: string; fileSize: number }> {
    try {
      const response = await api.post<{ success: boolean; data: { fileId: string; fileName: string; fileUrl: string; fileSize: number }; message?: string }>(
        `/invoices/generate-pdf/community/${communityId}`,
        {
          invoiceNumber,
          invoiceDate,
          charges,
          total
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error generating invoice PDF', 'DataService', { communityId, invoiceNumber }, error as Error);
      throw error;
    }
  }

  /**
   * Generate management fee invoices for all active communities
   */
  async generateManagementFeeInvoices(invoiceDate: string): Promise<{ generated: number; total: number; results: any[]; errors?: any[] }> {
    try {
      const response = await api.post<{ success: boolean; data: { generated: number; total: number; results: any[]; errors?: any[] }; message?: string }>(
        '/invoices/generate-management-fees',
        { invoiceDate }
      );
      return response.data;
    } catch (error) {
      logger.error('Error generating management fee invoices', 'DataService', { invoiceDate }, error as Error);
      throw error;
    }
  }
}

export default new DataService();
