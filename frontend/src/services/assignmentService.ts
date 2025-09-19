import api from './api';
import { logger } from './logger';

export interface AssignmentRequest {
  id?: number;
  ticketNumber?: string;
  communityID: number;
  requestedRoleType: 'Manager' | 'Director' | 'Assistant';
  requestedRoleTitle: string;
  effectiveDate: string;
  endDate?: string;
  replacingStakeholderID?: number;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  notes: string;
  createdBy: number;
  status?: 'Pending' | 'Hold' | 'InProgress' | 'Completed' | 'Rejected';
  createdOn?: string;
  modifiedOn?: string;
}

export interface AssignmentRequestResponse {
  id: number;
  ticketNumber: string;
  status: string;
  priority: string;
}

export interface AssignmentRequestDetails extends AssignmentRequest {
  communityCode?: string;
  communityName?: string;
  createdByName?: string;
  modifiedByName?: string;
  replacingStakeholderName?: string;
  notes?: Array<{
    id: number;
    noteText: string;
    isInternal: boolean;
    createdOn: string;
    createdByName: string;
  }>;
}

const assignmentService = {
  /**
   * Create a new assignment request
   */
  async createAssignmentRequest(request: AssignmentRequest): Promise<AssignmentRequestResponse> {
    try {
      logger.info('Creating assignment request', 'AssignmentService', request);
      
      const response = await api.post<AssignmentRequestResponse>('/assignments/requests', request);

      logger.info('Assignment request created successfully', 'AssignmentService', { ticketNumber: response.ticketNumber });
      return response;
    } catch (error) {
      logger.error('Failed to create assignment request', 'AssignmentService', request, error as Error);
      throw error;
    }
  },

  /**
   * Get assignment requests for a user
   */
  async getAssignmentRequests(filters?: {
    createdBy?: number;
    status?: string;
  }): Promise<AssignmentRequestDetails[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.createdBy) params.append('createdBy', filters.createdBy.toString());
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const endpoint = `/assignments/requests${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<AssignmentRequestDetails[]>(endpoint);

      return response;
    } catch (error) {
      logger.error('Failed to fetch assignment requests', 'AssignmentService', filters, error as Error);
      throw error;
    }
  },

  /**
   * Get assignment request by ID with notes
   */
  async getAssignmentRequestById(id: number): Promise<AssignmentRequestDetails> {
    try {
      const response = await api.get<AssignmentRequestDetails>(`/assignments/requests/${id}`);

      return response;
    } catch (error) {
      logger.error('Failed to fetch assignment request', 'AssignmentService', { id }, error as Error);
      throw error;
    }
  },

  /**
   * Add a note to an assignment request
   */
  async addNote(ticketId: number, noteText: string, isInternal: boolean = false, createdBy: number): Promise<void> {
    try {
      // This endpoint would need to be implemented in the backend
      await api.post('/assignments/requests/notes', {
        ticketType: 'AssignmentRequest',
        ticketId,
        noteText,
        isInternal,
        createdBy
      });
    } catch (error) {
      logger.error('Failed to add note to assignment request', 'AssignmentService', { ticketId, noteText }, error as Error);
      throw error;
    }
  }
};

export default assignmentService;
