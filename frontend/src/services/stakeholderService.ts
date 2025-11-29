import type { 
  Stakeholder, 
  CreateStakeholderRequest, 
  UpdateStakeholderRequest,
  StakeholderListResponse,
  StakeholderResponse,
  StakeholderDeleteResponse,
  StakeholderSearchParams,
  StakeholderTypeParams
} from '../types/stakeholder';
import api from './api';
import logger from './logger';

class StakeholderService {
  private baseUrl = '/stakeholders';

  /**
   * Get all stakeholders
   */
  async getAllStakeholders(): Promise<StakeholderListResponse> {
    try {
      const response = await api.get(this.baseUrl);
      return response;
    } catch (error) {
      logger.error('Error fetching stakeholders', 'StakeholderService', undefined, error as Error);
      throw error;
    }
  }

  /**
   * Get stakeholder by ID
   */
  async getStakeholderById(id: number): Promise<StakeholderResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      logger.error(`Error fetching stakeholder ${id}`, 'StakeholderService', { id }, error as Error);
      throw error;
    }
  }

  /**
   * Get stakeholders by type
   */
  async getStakeholdersByType(type: string): Promise<StakeholderListResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/type/${encodeURIComponent(type)}`);
      return response;
    } catch (error) {
      logger.error(`Error fetching stakeholders by type ${type}`, 'StakeholderService', { type }, error as Error);
      throw error;
    }
  }

  /**
   * Search stakeholders
   */
  async searchStakeholders(params: StakeholderSearchParams): Promise<StakeholderListResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/search`, {
        params: { q: params.q }
      });
      return response;
    } catch (error) {
      logger.error(`Error searching stakeholders with query "${params.q}"`, 'StakeholderService', { query: params.q }, error as Error);
      throw error;
    }
  }

  /**
   * Create new stakeholder
   */
  async createStakeholder(stakeholderData: CreateStakeholderRequest): Promise<StakeholderResponse> {
    try {
    // Map frontend field names to backend field names
    const backendData = {
      StakeholderType: stakeholderData.Type,
      SubType: stakeholderData.SubType,
      AccessLevel: stakeholderData.AccessLevel,
      CommunityID: stakeholderData.CommunityID,
      FirstName: stakeholderData.FirstName,
      LastName: stakeholderData.LastName,
      CompanyName: stakeholderData.CompanyName,
      Email: stakeholderData.Email,
      Phone: stakeholderData.Phone,
      MobilePhone: stakeholderData.MobilePhone,
      PreferredCommunication: stakeholderData.PreferredContactMethod,
      Status: stakeholderData.Status,
      PortalAccessEnabled: stakeholderData.PortalAccessEnabled,
      Notes: stakeholderData.Notes
    };
      
      const response = await api.post(this.baseUrl, backendData);
      return response;
    } catch (error) {
      logger.error('Error creating stakeholder', 'StakeholderService', undefined, error as Error);
      throw error;
    }
  }

  /**
   * Update stakeholder
   */
  async updateStakeholder(id: number, stakeholderData: UpdateStakeholderRequest): Promise<StakeholderResponse> {
    try {
      // Map frontend field names to backend field names
      const backendData: any = {};
      
      if (stakeholderData.Type !== undefined) backendData.Type = stakeholderData.Type;
      if (stakeholderData.SubType !== undefined) backendData.SubType = stakeholderData.SubType;
      if (stakeholderData.AccessLevel !== undefined) backendData.AccessLevel = stakeholderData.AccessLevel;
      if (stakeholderData.CommunityID !== undefined) backendData.CommunityID = stakeholderData.CommunityID;
      if (stakeholderData.FirstName !== undefined) backendData.FirstName = stakeholderData.FirstName;
      if (stakeholderData.LastName !== undefined) backendData.LastName = stakeholderData.LastName;
      if (stakeholderData.CompanyName !== undefined) backendData.CompanyName = stakeholderData.CompanyName;
      if (stakeholderData.Email !== undefined) backendData.Email = stakeholderData.Email;
      if (stakeholderData.Phone !== undefined) backendData.Phone = stakeholderData.Phone;
      if (stakeholderData.MobilePhone !== undefined) backendData.MobilePhone = stakeholderData.MobilePhone;
      if (stakeholderData.PreferredContactMethod !== undefined) backendData.PreferredContactMethod = stakeholderData.PreferredContactMethod;
      if (stakeholderData.Status !== undefined) backendData.Status = stakeholderData.Status;
      if (stakeholderData.PortalAccessEnabled !== undefined) backendData.PortalAccessEnabled = stakeholderData.PortalAccessEnabled;
      if (stakeholderData.Notes !== undefined) backendData.Notes = stakeholderData.Notes;
      
      const response = await api.put(`${this.baseUrl}/${id}`, backendData);
      return response;
    } catch (error) {
      logger.error(`Error updating stakeholder ${id}`, 'StakeholderService', { id }, error as Error);
      throw error;
    }
  }

  /**
   * Delete stakeholder (soft delete)
   */
  async deleteStakeholder(id: number): Promise<StakeholderDeleteResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      logger.error(`Error deleting stakeholder ${id}`, 'StakeholderService', { id }, error as Error);
      throw error;
    }
  }

  /**
   * Get stakeholder with properties
   */
  async getStakeholderWithProperties(id: number): Promise<StakeholderListResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/properties`);
      return response;
    } catch (error) {
      logger.error(`Error fetching stakeholder ${id} with properties`, 'StakeholderService', { id }, error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const stakeholderService = new StakeholderService();
export default stakeholderService;
