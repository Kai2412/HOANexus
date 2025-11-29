import React, { useState, useEffect } from 'react';
import { 
  TicketIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { TicketService } from '../../services';
import type { Ticket, TicketListResponse } from '../../services/ticketService';
import { useLoading } from '../../context';
import logger from '../../services/logger';

interface TicketsProps {
  onClose?: () => void;
}

type TicketStatus = 'Pending' | 'Hold' | 'InProgress' | 'Completed' | 'Rejected';
type TicketPriority = 'Normal' | 'Urgent' | 'Emergency';
type TicketCategory = 'Management' | 'Operations' | 'Accounting' | 'Compliance';

const Tickets: React.FC<TicketsProps> = ({ onClose }) => {
  const { showLoading, hideLoading } = useLoading();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'All'>('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 25;
  
  // Real data state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tickets from API
  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: string[] = [];
      if (statusFilter !== 'All') filters.push(statusFilter);
      
      const priorities: string[] = [];
      if (priorityFilter !== 'All') priorities.push(priorityFilter);
      
      const categories: string[] = [];
      if (categoryFilter !== 'All') categories.push(categoryFilter);

      const response = await TicketService.getTickets({
        page: currentPage,
        pageSize: ticketsPerPage,
        search: searchTerm || undefined,
        status: filters.length > 0 ? filters : undefined,
        priority: priorities.length > 0 ? priorities : undefined,
        category: categories.length > 0 ? categories : undefined,
        // userId removed - backend gets user from JWT token
        sortBy: 'created',
        sortOrder: 'desc'
      });

      setTickets(response.tickets);
      setTotalTickets(response.totalCount);
    } catch (err) {
      logger.error('Error loading tickets', 'Tickets', undefined, err as Error);
      setError('Failed to load tickets. Please try again.');
      setTickets([]);
      setTotalTickets(0);
    } finally {
      setLoading(false);
    }
  };

  // Load tickets on component mount and when filters change
  useEffect(() => {
    loadTickets();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Reset to page 1 when filters change (except currentPage itself)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'Hold':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'InProgress':
        return <ClockIcon className="h-4 w-4 animate-pulse" />;
      case 'Completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'Hold':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'InProgress':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'Completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'Emergency':
        return 'text-red-700 dark:text-red-400';
      case 'Urgent':
        return 'text-orange-700 dark:text-orange-400';
      case 'Normal':
        return 'text-gray-700 dark:text-gray-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTicketMetadata = (ticket: Ticket) => {
    if (!ticket.metadata) return null;

    const { metadata } = ticket;
    
    switch (ticket.ticketNumber.split('-')[0]) {
      case 'ASG':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.requestedRole && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Role:</span>
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                  {metadata.requestedRole}
                </span>
              </span>
            )}
            {metadata.effectiveDate && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Effective:</span>
                <span>{metadata.effectiveDate}</span>
              </span>
            )}
          </div>
        );
        
      case 'MNT':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.location && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Location:</span>
                <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                  {metadata.location}
                </span>
              </span>
            )}
            {metadata.urgency && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Urgency:</span>
                <span className={`px-2 py-1 rounded ${
                  metadata.urgency === 'High' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                  metadata.urgency === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                  'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                }`}>
                  {metadata.urgency}
                </span>
              </span>
            )}
          </div>
        );
        
      case 'VIO':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.violationType && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded">
                  {metadata.violationType}
                </span>
              </span>
            )}
          </div>
        );
        
      case 'BAR':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.accountType && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Account:</span>
                <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded">
                  {metadata.accountType}
                </span>
              </span>
            )}
            {metadata.bankName && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Bank:</span>
                <span>{metadata.bankName}</span>
              </span>
            )}
          </div>
        );
        
      case 'WOR':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.contractor && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Contractor:</span>
                <span>{metadata.contractor}</span>
              </span>
            )}
            {metadata.estimatedCost && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Est. Cost:</span>
                <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                  ${metadata.estimatedCost.toLocaleString()}
                </span>
              </span>
            )}
          </div>
        );
        
      case 'COM':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.issueType && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Issue:</span>
                <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
                  {metadata.issueType}
                </span>
              </span>
            )}
          </div>
        );
        
      case 'EXP':
        return (
          <div className="flex flex-wrap gap-3 text-xs text-secondary">
            {metadata.amount && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Amount:</span>
                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded">
                  ${metadata.amount.toLocaleString()}
                </span>
              </span>
            )}
            {metadata.expenseType && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span>{metadata.expenseType}</span>
              </span>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderBreadcrumbs = () => (
    <nav className="flex items-center space-x-2 text-sm text-secondary">
      <button 
        onClick={onClose}
        className="hover:text-primary transition-colors"
      >
        Community Info
      </button>
      <span>›</span>
      <span className="text-primary font-medium">My Tickets</span>
    </nav>
  );

  // Pagination calculations (server-side filtering, so tickets are already filtered)
  const totalPages = Math.ceil(totalTickets / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const endIndex = startIndex + ticketsPerPage;
  const currentTickets = tickets; // Already paginated from server
  const hasMultiplePages = totalPages > 1;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-primary p-4">
        <div className="space-y-4">
          {/* Breadcrumbs */}
          <div>
            {renderBreadcrumbs()}
          </div>
          
          {/* Title and Stats */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
                <TicketIcon className="h-6 w-6" />
                My Tickets
              </h1>
              <p className="text-sm text-secondary">
                {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} found
                {hasMultiplePages && (
                  <span> • Showing {startIndex + 1}-{Math.min(endIndex, totalTickets)} of {totalTickets}</span>
                )}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-surface text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'All')}
                className="px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent"
              >
                <option value="All">All Categories</option>
                <option value="Management">Management</option>
                <option value="Operations">Operations</option>
                <option value="Accounting">Accounting</option>
                <option value="Compliance">Compliance</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')}
                className="px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Hold">Hold</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'All')}
                className="px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent"
              >
                <option value="All">All Priority</option>
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>

            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-auto p-4 bg-surface-secondary">
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">Error Loading Tickets</h3>
            <p className="text-secondary max-w-md mb-4">{error}</p>
            <button
              onClick={loadTickets}
              className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-royal-200 border-t-royal-600 mb-4"></div>
            <h3 className="text-lg font-medium text-primary mb-2">Loading Tickets...</h3>
            <p className="text-secondary">Please wait while we fetch your tickets.</p>
          </div>
        ) : currentTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <TicketIcon className="h-16 w-16 text-secondary mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No tickets found</h3>
            <p className="text-secondary max-w-md">
              {searchTerm || statusFilter !== 'All' || priorityFilter !== 'All' 
                ? 'Try adjusting your search or filters to find tickets.'
                : 'You haven\'t created any tickets yet. Submit a form to create your first ticket.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-surface border border-primary rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Ticket Header */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-royal-600 dark:text-royal-400">
                        {ticket.ticketNumber}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {ticket.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      {ticket.createdByMe ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                          My Ticket
                        </span>
                      ) : ticket.isFromMyCommunity ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          Community Ticket
                        </span>
                      ) : null}
                    </div>

                    {/* Ticket Details */}
                    <h3 className="text-base font-medium text-primary mb-1 truncate">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-secondary mb-2">
                      {ticket.type} • {ticket.communityCode} - {ticket.communityName}
                    </p>

                    {/* Type-specific metadata */}
                    {renderTicketMetadata(ticket) && (
                      <div className="mb-2">
                        {renderTicketMetadata(ticket)}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-secondary">
                      <span>Created: {formatDate(ticket.createdOn)}</span>
                      {ticket.modifiedOn !== ticket.createdOn && (
                        <span>Updated: {formatDate(ticket.modifiedOn)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination */}
            {hasMultiplePages && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary">
                <div className="text-sm text-secondary">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalTickets)} of {totalTickets} tickets
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-secondary hover:text-primary disabled:text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentPage === pageNum
                              ? 'bg-royal-600 text-white'
                              : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-secondary hover:text-primary disabled:text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Tickets;
