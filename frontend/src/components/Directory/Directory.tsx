import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon
} from '@heroicons/react/24/outline';
import DirectoryLookup from './DirectoryLookup';
import type { Stakeholder } from '../../types/stakeholder';
import { STAKEHOLDER_TYPES, STAKEHOLDER_STATUSES } from '../../types/stakeholder';
import { stakeholderService } from '../../services/stakeholderService';
import logger from '../../services/logger';

interface DirectoryProps {
  onBackToCommunity?: () => void;
  onAddStakeholder?: () => void;
}

const Directory: React.FC<DirectoryProps> = ({ onBackToCommunity, onAddStakeholder }) => {
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  
  // Stakeholder data state
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [filteredStakeholders, setFilteredStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const stakeholdersPerPage = 10;

  // Load stakeholders on component mount
  useEffect(() => {
    loadStakeholders();
  }, []);

  // Filter stakeholders when search term, type, or status changes
  useEffect(() => {
    filterStakeholders();
  }, [stakeholders, searchTerm, selectedType, selectedStatus]);

  // Reset to page 1 when filters change (except currentPage itself)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedType, selectedStatus]);

  const loadStakeholders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stakeholderService.getAllStakeholders();
      if (response.success) {
        // Sort stakeholders alphabetically by first name, then last name
        const sortedStakeholders = response.data.sort((a, b) => {
          const aFirstName = a.FirstName || '';
          const bFirstName = b.FirstName || '';
          const aLastName = a.LastName || '';
          const bLastName = b.LastName || '';
          
          // First sort by first name
          if (aFirstName !== bFirstName) {
            return aFirstName.localeCompare(bFirstName);
          }
          // If first names are the same, sort by last name
          return aLastName.localeCompare(bLastName);
        });
        
        setStakeholders(sortedStakeholders);
      } else {
        setError(response.message || 'Failed to load stakeholders');
      }
    } catch (err) {
      setError('Failed to load stakeholders. Please try again.');
      logger.error('Error loading stakeholders', 'Directory', undefined, err as Error);
    } finally {
      setLoading(false);
    }
  };

  const filterStakeholders = () => {
    let filtered = [...stakeholders];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(stakeholder => 
        (stakeholder.FirstName?.toLowerCase().includes(term)) ||
        (stakeholder.LastName?.toLowerCase().includes(term)) ||
        (stakeholder.CompanyName?.toLowerCase().includes(term)) ||
        (stakeholder.Email?.toLowerCase().includes(term)) ||
        (stakeholder.Phone?.includes(term)) ||
        (stakeholder.MobilePhone?.includes(term))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(stakeholder => stakeholder.Type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(stakeholder => stakeholder.Status === selectedStatus);
    }

    setFilteredStakeholders(filtered);
  };


  const handleDeleteStakeholder = async (id: string) => {
    try {
      const response = await stakeholderService.deleteStakeholder(id);
      if (response.success) {
        // Remove from local state
        setStakeholders(prev => prev.filter(s => s.StakeholderID !== id));
      } else {
        setError(response.message || 'Failed to delete stakeholder');
      }
    } catch (err) {
      setError('Failed to delete stakeholder. Please try again.');
      logger.error('Error deleting stakeholder', 'Directory', undefined, err as Error);
    }
  };

  const handleEditStakeholder = (updatedStakeholder: Stakeholder) => {
    // Update the stakeholder in the local state and re-sort
    setStakeholders(prev => {
      const updatedList = prev.map(s => s.StakeholderID === updatedStakeholder.StakeholderID ? updatedStakeholder : s);
      
      // Re-sort the list to maintain alphabetical order
      return updatedList.sort((a, b) => {
        const aFirstName = a.FirstName || '';
        const bFirstName = b.FirstName || '';
        const aLastName = a.LastName || '';
        const bLastName = b.LastName || '';
        
        // First sort by first name
        if (aFirstName !== bFirstName) {
          return aFirstName.localeCompare(bFirstName);
        }
        // If first names are the same, sort by last name
        return aLastName.localeCompare(bLastName);
      });
    });
    logger.debug('Stakeholder updated', 'Directory', { stakeholderId: updatedStakeholder.StakeholderID });
  };

  const handleViewStakeholder = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    // For now, just log - in the future this could open a detailed view modal
    logger.debug('View stakeholder', 'Directory', { stakeholderId: stakeholder.StakeholderID });
  };

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-primary font-medium">Directory</span>
      </div>
    );
  };

  // Calculate pagination
  const totalStakeholders = filteredStakeholders.length;
  const totalPages = Math.ceil(totalStakeholders / stakeholdersPerPage);
  const startIndex = (currentPage - 1) * stakeholdersPerPage;
  const endIndex = startIndex + stakeholdersPerPage;
  const paginatedStakeholders = filteredStakeholders.slice(startIndex, endIndex);
  const hasMultiplePages = totalPages > 1;


  return (
    <div className="h-full flex flex-col">
      {/* Directory Header - Fixed */}
      <div className="bg-surface-secondary border-b border-primary p-4 flex-shrink-0">
        <div className="space-y-4">
          {/* Breadcrumbs */}
          <div>
            {renderBreadcrumbs()}
          </div>
          
          {/* Title and Count */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-primary">Stakeholder Directory</h1>
              <p className="text-sm text-secondary">Search and manage community stakeholders</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-secondary">
                {filteredStakeholders.length} of {stakeholders.length} stakeholders
              </div>
              <button
                onClick={() => onAddStakeholder?.()}
                className="flex items-center space-x-2 bg-royal-600 hover:bg-royal-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <UserPlusIcon className="h-5 w-5" />
                <span>Add New</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
                <input
                  type="text"
                  placeholder="Search by name, company, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg bg-surface text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="sm:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
              >
                <option value="all">All Types</option>
                {STAKEHOLDER_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition"
              >
                <option value="all">All Statuses</option>
                {STAKEHOLDER_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Directory User List - Scrollable */}
      <div className="overflow-y-auto p-6" style={{ height: 'calc(100vh - 350px)' }}>
        <DirectoryLookup
          stakeholders={stakeholders}
          filteredStakeholders={paginatedStakeholders}
          loading={loading}
          error={error}
          onEditStakeholder={handleEditStakeholder}
          onViewStakeholder={handleViewStakeholder}
          onDeleteStakeholder={handleDeleteStakeholder}
          totalStakeholders={totalStakeholders}
          currentPage={currentPage}
          totalPages={totalPages}
          hasMultiplePages={hasMultiplePages}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Directory;
