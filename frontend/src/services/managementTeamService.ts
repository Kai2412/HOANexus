import api from './api';
import { logger } from './logger';

export interface ManagementTeamMember {
  id: number;
  stakeholderId: number;
  roleType: 'Director' | 'Manager' | 'Assistant';
  roleTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

const managementTeamService = {
  /**
   * Get management team for a specific community
   */
  async getManagementTeam(communityId: number): Promise<ManagementTeamMember[]> {
    try {
      logger.info('Fetching management team', 'ManagementTeamService', { communityId });
      
      const response = await api.get<{
        success: boolean;
        data: ManagementTeamMember[];
      }>(`/management-team/community/${communityId}`);

      logger.info('Management team fetched successfully', 'ManagementTeamService', { 
        communityId, 
        memberCount: response.data.length 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch management team', 'ManagementTeamService', { communityId }, error as Error);
      throw error;
    }
  }
};

export default managementTeamService;
