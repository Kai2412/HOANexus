import api from './api';
import { logger } from './logger';

export interface TicketListRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string[];
  priority?: string[];
  category?: string[];
  ticketType?: string[];
  communityId?: number[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created' | 'modified' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  // userId removed - backend gets user from JWT token
}

export interface TicketMetadata {
  // Assignment Request specific
  requestedRole?: string;
  effectiveDate?: string;
  // Maintenance Request specific
  location?: string;
  urgency?: string;
  // Violation Appeal specific
  violationType?: string;
  appealReason?: string;
  // Bank Account Request specific
  accountType?: string;
  bankName?: string;
  // Work Order specific
  contractor?: string;
  estimatedCost?: number;
  // Complaint specific
  complainantName?: string;
  issueType?: string;
  // Expense Report specific
  amount?: number;
  expenseType?: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  ticketType: string; // 'AssignmentRequest', 'MaintenanceRequest', etc.
  type: string; // Display name: 'Assignment Request', 'Maintenance Request', etc.
  category: 'Management' | 'Operations' | 'Accounting' | 'Compliance';
  title: string;
  status: 'Pending' | 'Hold' | 'InProgress' | 'Completed' | 'Rejected';
  priority: 'Normal' | 'Urgent' | 'Emergency';
  createdOn: string;
  modifiedOn: string;
  communityName: string;
  communityCode: string;
  createdByMe: boolean;
  isFromMyCommunity: boolean;
  metadata?: TicketMetadata;
}

export interface TicketListResponse {
  tickets: Ticket[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const ticketService = {
  /**
   * Get tickets for a user with pagination and filtering
   */
  async getTickets(request: TicketListRequest): Promise<TicketListResponse> {
    try {
      logger.info('Fetching tickets', 'TicketService', request);
      
      const params = new URLSearchParams();
      
      // Pagination
      if (request.page) params.append('page', request.page.toString());
      if (request.pageSize) params.append('pageSize', request.pageSize.toString());
      
      // Filters
      if (request.search) params.append('search', request.search);
      if (request.status?.length) params.append('status', request.status.join(','));
      if (request.priority?.length) params.append('priority', request.priority.join(','));
      if (request.category?.length) params.append('category', request.category.join(','));
      if (request.ticketType?.length) params.append('ticketType', request.ticketType.join(','));
      if (request.communityId?.length) params.append('communityId', request.communityId.join(','));
      if (request.dateFrom) params.append('dateFrom', request.dateFrom);
      if (request.dateTo) params.append('dateTo', request.dateTo);
      if (request.sortBy) params.append('sortBy', request.sortBy);
      if (request.sortOrder) params.append('sortOrder', request.sortOrder);
      
      // userId removed - backend gets user from JWT token

      const queryString = params.toString();
      const endpoint = `/tickets${queryString ? `?${queryString}` : ''}`;

      const response = await api.get<TicketListResponse>(endpoint);

      logger.info('Tickets fetched successfully', 'TicketService', { 
        count: response.tickets.length, 
        total: response.totalCount 
      });
      
      return response;
    } catch (error) {
      logger.error('Failed to fetch tickets', 'TicketService', request, error as Error);
      throw error;
    }
  },

  /**
   * Get ticket by ID with full details
   */
  async getTicketById(id: number): Promise<Ticket> {
    try {
      const response = await api.get<Ticket>(`/tickets/${id}`);
      return response;
    } catch (error) {
      logger.error('Failed to fetch ticket by ID', 'TicketService', { id }, error as Error);
      throw error;
    }
  }
};

export default ticketService;
