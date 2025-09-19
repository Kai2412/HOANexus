import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon
} from '@heroicons/react/24/outline';
import DirectoryLookup from './DirectoryLookup';
import AddStakeholder from './AddStakeholder';
import type { Stakeholder } from '../../types/stakeholder';
import { STAKEHOLDER_TYPES, STAKEHOLDER_STATUSES } from '../../types/stakeholder';
import { stakeholderService } from '../../services/stakeholderService';

type DirectoryView = 'lookup' | 'add';

interface DirectoryProps {
  initialView?: DirectoryView;
  onBackToCommunity?: () => void;
}

const Directory: React.FC<DirectoryProps> = ({ initialView = 'lookup', onBackToCommunity }) => {
  const [currentView, setCurrentView] = useState<DirectoryView>(initialView);
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

  // Load stakeholders on component mount
  useEffect(() => {
    if (currentView === 'lookup') {
      loadStakeholders();
    }
  }, [currentView]);

  // Filter stakeholders when search term, type, or status changes
  useEffect(() => {
    filterStakeholders();
  }, [stakeholders, searchTerm, selectedType, selectedStatus]);

  const loadStakeholders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stakeholderService.getAllStakeholders();
      console.log('Stakeholder API Response:', response);
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
      console.error('Error loading stakeholders:', err);
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

  const handleViewChange = (view: DirectoryView) => {
    setCurrentView(view);
    setSelectedStakeholder(null);
  };

  const handleStakeholderCreated = (stakeholder: Stakeholder) => {
    // After creating a stakeholder, switch back to lookup view and refresh the list
    setCurrentView('lookup');
    loadStakeholders();
  };

  const handleDeleteStakeholder = async (id: number) => {
    try {
      const response = await stakeholderService.deleteStakeholder(id);
      if (response.success) {
        // Remove from local state
        setStakeholders(prev => prev.filter(s => s.ID !== id));
      } else {
        setError(response.message || 'Failed to delete stakeholder');
      }
    } catch (err) {
      setError('Failed to delete stakeholder. Please try again.');
      console.error('Error deleting stakeholder:', err);
    }
  };

  const handleEditStakeholder = (updatedStakeholder: Stakeholder) => {
    // Update the stakeholder in the local state and re-sort
    setStakeholders(prev => {
      const updatedList = prev.map(s => s.ID === updatedStakeholder.ID ? updatedStakeholder : s);
      
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
    console.log('Stakeholder updated:', updatedStakeholder);
  };

  const handleViewStakeholder = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    // For now, just log - in the future this could open a detailed view modal
    console.log('View stakeholder:', stakeholder);
  };

  const handleBreadcrumbClick = (target: 'community' | 'directory') => {
    if (target === 'community' && onBackToCommunity) {
      onBackToCommunity();
    } else if (target === 'directory') {
      setCurrentView('lookup');
    }
  };

  const renderBreadcrumbs = () => {
    if (currentView === 'lookup') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => handleBreadcrumbClick('community')}
            className="text-secondary hover:text-primary transition-colors"
          >
            Community Info
          </button>
          <span className="text-tertiary">&gt;</span>
          <span className="text-primary font-medium">Directory</span>
        </div>
      );
    } else if (currentView === 'add') {
      return (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => handleBreadcrumbClick('community')}
            className="text-secondary hover:text-primary transition-colors"
          >
            Community Info
          </button>
          <span className="text-tertiary">&gt;</span>
          <button
            onClick={() => handleBreadcrumbClick('directory')}
            className="text-secondary hover:text-primary transition-colors"
          >
            Directory
          </button>
          <span className="text-tertiary">&gt;</span>
          <span className="text-primary font-medium">Add New</span>
        </div>
      );
    }
    return null;
  };

  const renderView = () => {
    switch (currentView) {
      case 'lookup':
        return (
          <DirectoryLookup
            stakeholders={stakeholders}
            filteredStakeholders={filteredStakeholders}
            loading={loading}
            error={error}
            onEditStakeholder={handleEditStakeholder}
            onViewStakeholder={handleViewStakeholder}
            onDeleteStakeholder={handleDeleteStakeholder}
          />
        );
      case 'add':
        return (
          <AddStakeholder
            onSuccess={handleStakeholderCreated}
            onCancel={() => setCurrentView('lookup')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <div className="bg-surface-secondary border-b border-primary p-4">
        {currentView === 'lookup' ? (
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
                  onClick={() => handleViewChange('add')}
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
        ) : (
          <div className="space-y-4">
            {/* Breadcrumbs */}
            <div>
              {renderBreadcrumbs()}
            </div>
            
            {/* Title */}
            <div>
              <h1 className="text-xl font-semibold text-primary">Add New Stakeholder</h1>
              <p className="text-sm text-secondary">Create a new stakeholder in the community directory</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
};

export default Directory;
