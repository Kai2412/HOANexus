import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CogIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import type { Community } from '../../types';
import { getCommunityStatusColor, getCommunityTypeColor, getCommunityStatusColorName, getCommunityTypeColorName } from '../../utils/statusColors';
import { CommunitySearchBar, SearchResultsIndicator } from '../CommunitySearchBar';
import { useCommunitySearch } from '../../hooks/useCommunitySearch';
import EditModal from '../EditModal';
import type { FieldConfig } from '../EditModal';
import dataService from '../../services/dataService';
import ManagementTeam from '../ManagementTeam';

interface CommunityInfoProps {
  community: Community;
  communities: Community[];
  onCommunityUpdate?: (updatedCommunity: Community) => void;
}

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEdit?: () => void;
  canEdit?: boolean;
  highlightClass?: string;
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  chip?: boolean;
  chipColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';
}

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children, onEdit, canEdit = false, highlightClass = "" }) => (
  <div className={`bg-surface rounded-lg shadow-sm border border-primary theme-transition ${highlightClass}`}>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-royal-600 dark:text-royal-400">{icon}</div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
        </div>
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={`Edit ${title}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <hr className="mb-4 border-primary" />
      <div className="space-y-3">
        {children}
      </div>
    </div>
  </div>
);

const InfoRow: React.FC<InfoRowProps> = ({ 
  label, 
  value, 
  chip = false, 
  chipColor = 'gray' 
}) => {
  const displayValue = value || 'Not Available';
  
  const chipColors = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-secondary">{label}:</span>
      {chip ? (
        <span className={`px-2 py-1 rounded-full text-xs font-medium theme-transition ${chipColors[chipColor]}`}>
          {displayValue}
        </span>
      ) : (
        <span className="text-sm font-semibold text-primary text-right">
          {displayValue}
        </span>
      )}
    </div>
  );
};

const CommunityInfo: React.FC<CommunityInfoProps> = ({ community, communities, onCommunityUpdate }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatStatus = (status: string | undefined): string => {
    if (!status) return 'Unknown';
    
    switch (status.toLowerCase()) {
      case 'indevelopment':
        return 'In Development';
      case 'underconstruction':
        return 'Under Construction';
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'transition':
        return 'Transition';
      default:
        // For any other status, add spaces and capitalize properly
        return status
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  };

  const formatCommunityType = (type: string | undefined): string => {
    if (!type) return 'Unknown';
    
    switch (type.toLowerCase()) {
      case 'masterplanned':
        return 'Master Planned';
      case 'singlefamily':
        return 'Single Family';
      case 'townhome':
        return 'Town Home';
      case 'condominium':
        return 'Condominium';
      case 'mixeduse':
        return 'Mixed Use';
      default:
        // For any other type, add spaces and capitalize properly
        return type
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  };

  const [formData, setFormData] = useState<Record<string, any>>({});

  // Prepare searchable data from community - separate entries for each card
  const searchableData = React.useMemo(() => {
    if (!community) return [];
    
    return [
      {
        id: 'basic',
        labels: [
          'Community Code', 'Display Name', 'Community Type', 
          'Total Units', 'Status', 'Sub Association', 'Master Association'
        ]
      },
      {
        id: 'geographic',
        labels: [
          'State', 'City', 'Address Line 1', 'Address Line 2', 
          'Postal Code', 'Country', 'Address', 'Location', 'Zip Code'
        ]
      },
      {
        id: 'legal',
        labels: [
          'Legal Name', 'Tax ID', 'Formation Date'
        ]
      },
      {
        id: 'contract',
        labels: [
          'Contract Start', 'Contract End', 'Fiscal Year Start', 'Fiscal Year End'
        ]
      },
      {
        id: 'system',
        labels: [
          'Time Zone', 'Data Completeness', 'Last Updated', 
          'Created Date', 'Record ID', 'Last Audit Date', 'Next Audit Due'
        ]
      },
      {
        id: 'management',
        labels: [
          'Management Team', 'Director', 'Manager', 'Assistant', 'Regional Director',
          'Community Manager', 'On-site Manager', 'Manager in Training',
          'Maintenance Coordinator', 'Compliance Specialist', 'Accounting Specialist',
          'General Assistant', 'Staff', 'Team', 'Personnel', 'Assignments',
          'Roles', 'Leadership', 'Management', 'Team Members'
        ]
      }
    ];
  }, [community]);

  // Initialize search functionality
  const {
    searchTerm,
    searchResults,
    isSearching,
    search,
    clearSearch,
    getCardHighlightClass
  } = useCommunitySearch({ data: searchableData });

  if (!community) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-secondary">
          Select a community to view information
        </h3>
      </div>
    );
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not Set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };


  const formatStatusDisplay = (status: string | undefined): string => {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'indevelopment': return 'In Development';
      case 'transition': return 'Transition';
      case 'terminated': return 'Terminated';
      default: return status || 'Unknown';
    }
  };

  // Edit handlers
  const handleEditCard = (cardType: string) => {
    setEditingCard(cardType);
    setFormData(getInitialData(cardType));
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingCard(null);
  };

  const handleSave = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      console.log('Saving data for', editingCard, ':', data);
      
      // Prepare the data for the API call
      const updateData: Record<string, any> = {};
      
      // Map frontend field names to database field names
      switch (editingCard) {
        case 'basic':
          updateData.Pcode = data.pcode;
          updateData.DisplayName = data.displayName;
          updateData.CommunityType = data.communityType;
          updateData.Status = data.status;
          updateData.IsSubAssociation = data.isSubAssociation === 'true';
          updateData.MasterAssociation = data.parentAssociation;
          break;
        case 'geographic':
          // Exclude addressSearch from database save (it's just for UI)
          updateData.State = data.state;
          updateData.City = data.city;
          updateData.AddressLine1 = data.addressLine1;
          updateData.AddressLine2 = data.addressLine2;
          updateData.PostalCode = data.postalCode;
          updateData.Country = data.country;
          break;
        case 'legal':
          updateData.Name = data.legalName; // Map legalName to Name in database
          updateData.TaxId = data.taxId;
          updateData.FormationDate = data.formationDate;
          break;
        case 'contract':
          updateData.ContractStartDate = data.contractStartDate;
          updateData.ContractEndDate = data.contractEndDate;
          updateData.FiscalYearStart = data.fiscalYearStart;
          updateData.FiscalYearEnd = data.fiscalYearEnd;
          break;
        case 'system':
          updateData.TimeZone = data.timeZone;
          updateData.LastAuditDate = data.lastAuditDate;
          updateData.NextAuditDate = data.nextAuditDate;
          break;
        default:
          throw new Error(`Unknown card type: ${editingCard}`);
      }
      
      // Call the API to update the community
      const requestData = {
        id: community.id,
        ...updateData
      };
      
      
      const response = await dataService.updateCommunity(community.id, requestData);
      
      if (response.success) {
        // Refresh the community data to show updated information
        try {
          const updatedCommunity = await dataService.getCommunityById(community.id);
          
          // Notify parent component of the update
          if (onCommunityUpdate) {
            onCommunityUpdate(updatedCommunity);
          }
        } catch (refreshError) {
          console.error('Failed to refresh community data:', refreshError);
          // Don't throw here - the save was successful, just the refresh failed
        }
      } else {
        throw new Error(response.message || 'Failed to update community');
      }
      
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Field configurations for each card
  const getFieldConfig = (cardType: string): FieldConfig[] => {
    switch (cardType) {
      case 'basic':
        return [
          {
            key: 'pcode',
            label: 'Community Code',
            type: 'text',
            required: true,
            placeholder: 'Enter community code'
          },
          {
            key: 'displayName',
            label: 'Display Name',
            type: 'text',
            required: true,
            placeholder: 'Enter display name'
          },
          {
            key: 'communityType',
            label: 'Community Type',
            type: 'select',
            required: true,
            options: [
              { value: 'SingleFamily', label: 'Single Family' },
              { value: 'Condo', label: 'Condominium' },
              { value: 'TownHome', label: 'Town Home' },
              { value: 'MasterPlanned', label: 'Master Planned' },
              { value: 'MixedUse', label: 'Mixed Use' }
            ]
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select Status' },
              { value: 'Active', label: 'Active' },
              { value: 'InDevelopment', label: 'In Development' },
              { value: 'Transition', label: 'Transition' },
              { value: 'Terminated', label: 'Terminated' }
            ]
          },
          {
            key: 'isSubAssociation',
            label: 'Sub Association',
            type: 'select',
            required: false,
            options: [
              { value: 'false', label: 'No' },
              { value: 'true', label: 'Yes' }
            ]
          },
          {
            key: 'parentAssociation',
            label: 'Master Association',
            type: 'select-with-input',
            required: false,
            placeholder: 'Enter master association name',
            conditional: {
              dependsOn: 'isSubAssociation',
              showWhen: 'true'
            },
            options: [
              { value: '', label: 'Select Master Association' },
              ...communities
                .filter(c => c.id !== community.id) // Exclude current community
                .map(c => ({ value: c.displayName || c.name, label: c.displayName || c.name }))
            ]
          }
        ];
      case 'geographic':
        return [
          {
            key: 'addressSearch',
            label: 'Search Address',
            type: 'places-autocomplete',
            placeholder: 'Type to search addresses...',
            required: false
          },
          {
            key: 'state',
            label: 'State',
            type: 'select',
            required: false,
            options: [
              { value: '', label: 'Select State' },
              { value: 'AL', label: 'Alabama (AL)' },
              { value: 'AK', label: 'Alaska (AK)' },
              { value: 'AZ', label: 'Arizona (AZ)' },
              { value: 'AR', label: 'Arkansas (AR)' },
              { value: 'CA', label: 'California (CA)' },
              { value: 'CO', label: 'Colorado (CO)' },
              { value: 'CT', label: 'Connecticut (CT)' },
              { value: 'DE', label: 'Delaware (DE)' },
              { value: 'FL', label: 'Florida (FL)' },
              { value: 'GA', label: 'Georgia (GA)' },
              { value: 'HI', label: 'Hawaii (HI)' },
              { value: 'ID', label: 'Idaho (ID)' },
              { value: 'IL', label: 'Illinois (IL)' },
              { value: 'IN', label: 'Indiana (IN)' },
              { value: 'IA', label: 'Iowa (IA)' },
              { value: 'KS', label: 'Kansas (KS)' },
              { value: 'KY', label: 'Kentucky (KY)' },
              { value: 'LA', label: 'Louisiana (LA)' },
              { value: 'ME', label: 'Maine (ME)' },
              { value: 'MD', label: 'Maryland (MD)' },
              { value: 'MA', label: 'Massachusetts (MA)' },
              { value: 'MI', label: 'Michigan (MI)' },
              { value: 'MN', label: 'Minnesota (MN)' },
              { value: 'MS', label: 'Mississippi (MS)' },
              { value: 'MO', label: 'Missouri (MO)' },
              { value: 'MT', label: 'Montana (MT)' },
              { value: 'NE', label: 'Nebraska (NE)' },
              { value: 'NV', label: 'Nevada (NV)' },
              { value: 'NH', label: 'New Hampshire (NH)' },
              { value: 'NJ', label: 'New Jersey (NJ)' },
              { value: 'NM', label: 'New Mexico (NM)' },
              { value: 'NY', label: 'New York (NY)' },
              { value: 'NC', label: 'North Carolina (NC)' },
              { value: 'ND', label: 'North Dakota (ND)' },
              { value: 'OH', label: 'Ohio (OH)' },
              { value: 'OK', label: 'Oklahoma (OK)' },
              { value: 'OR', label: 'Oregon (OR)' },
              { value: 'PA', label: 'Pennsylvania (PA)' },
              { value: 'RI', label: 'Rhode Island (RI)' },
              { value: 'SC', label: 'South Carolina (SC)' },
              { value: 'SD', label: 'South Dakota (SD)' },
              { value: 'TN', label: 'Tennessee (TN)' },
              { value: 'TX', label: 'Texas (TX)' },
              { value: 'UT', label: 'Utah (UT)' },
              { value: 'VT', label: 'Vermont (VT)' },
              { value: 'VA', label: 'Virginia (VA)' },
              { value: 'WA', label: 'Washington (WA)' },
              { value: 'WV', label: 'West Virginia (WV)' },
              { value: 'WI', label: 'Wisconsin (WI)' },
              { value: 'WY', label: 'Wyoming (WY)' },
              { value: 'DC', label: 'District of Columbia (DC)' }
            ]
          },
          {
            key: 'city',
            label: 'City',
            type: 'text',
            required: false,
            placeholder: 'Enter city name'
          },
          {
            key: 'addressLine1',
            label: 'Address Line 1',
            type: 'text',
            required: false,
            placeholder: 'Enter primary address'
          },
          {
            key: 'addressLine2',
            label: 'Address Line 2',
            type: 'text',
            required: false,
            placeholder: 'Enter secondary address (optional)'
          },
          {
            key: 'postalCode',
            label: 'Postal Code',
            type: 'text',
            required: false,
            placeholder: 'Enter ZIP/postal code'
          },
          {
            key: 'country',
            label: 'Country',
            type: 'select',
            required: false,
            options: [
              { value: 'USA', label: 'United States' },
              { value: 'CAN', label: 'Canada' },
              { value: 'MEX', label: 'Mexico' },
              { value: 'OTHER', label: 'Other' }
            ]
          }
        ];
      case 'legal':
        return [
          {
            key: 'legalName',
            label: 'Legal Name',
            type: 'text',
            required: true,
            placeholder: 'Enter legal name'
          },
          {
            key: 'taxId',
            label: 'Tax ID',
            type: 'text',
            required: false,
            placeholder: 'Enter tax ID (e.g., 75-8901234)'
          },
          {
            key: 'formationDate',
            label: 'Formation Date',
            type: 'date',
            required: false
          }
        ];
      case 'contract':
        return [
          {
            key: 'contractStartDate',
            label: 'Contract Start',
            type: 'date',
            required: false
          },
          {
            key: 'contractEndDate',
            label: 'Contract End',
            type: 'date',
            required: false
          },
          {
            key: 'fiscalYearStart',
            label: 'Fiscal Year Start',
            type: 'date',
            required: false
          },
          {
            key: 'fiscalYearEnd',
            label: 'Fiscal Year End',
            type: 'date',
            required: false
          }
        ];
      case 'system':
        return [
          {
            key: 'timeZone',
            label: 'Time Zone',
            type: 'select',
            required: false,
            options: [
              { value: '', label: 'Select Time Zone' },
              { value: 'Eastern Time (ET)', label: 'Eastern Time (ET)' },
              { value: 'Central Time (CT)', label: 'Central Time (CT)' },
              { value: 'Mountain Time (MT)', label: 'Mountain Time (MT)' },
              { value: 'Mountain Time - Arizona (MST)', label: 'Mountain Time - Arizona (MST)' },
              { value: 'Pacific Time (PT)', label: 'Pacific Time (PT)' },
              { value: 'Alaska Time (AKT)', label: 'Alaska Time (AKT)' },
              { value: 'Hawaii Time (HST)', label: 'Hawaii Time (HST)' },
              { value: 'Eastern Time - Canada (ET)', label: 'Eastern Time - Canada (ET)' },
              { value: 'Pacific Time - Canada (PT)', label: 'Pacific Time - Canada (PT)' },
              { value: 'Greenwich Mean Time (GMT)', label: 'Greenwich Mean Time (GMT)' },
              { value: 'Central European Time (CET)', label: 'Central European Time (CET)' },
              { value: 'Japan Standard Time (JST)', label: 'Japan Standard Time (JST)' },
              { value: 'China Standard Time (CST)', label: 'China Standard Time (CST)' },
              { value: 'Australian Eastern Time (AET)', label: 'Australian Eastern Time (AET)' }
            ]
          },
          {
            key: 'lastAuditDate',
            label: 'Last Audit Date',
            type: 'date',
            required: false
          },
          {
            key: 'nextAuditDate',
            label: 'Next Audit Due',
            type: 'date',
            required: false
          }
        ];
      default:
        return [];
    }
  };

  const getInitialData = (cardType: string): Record<string, any> => {
    switch (cardType) {
      case 'basic':
        return {
          pcode: community.pcode,
          displayName: community.displayName,
          communityType: community.communityType,
          status: community.status,
          isSubAssociation: (community.isSubAssociation || false).toString(),
          parentAssociation: community.masterAssociation || ''
        };
      case 'geographic':
        return {
          addressSearch: '', // This will be populated by Google Places
          state: community.state || '',
          city: community.city || '',
          addressLine1: community.addressLine1 || '',
          addressLine2: community.addressLine2 || '',
          postalCode: community.postalCode || '',
          country: community.country || 'USA'
        };
      case 'legal':
        return {
          legalName: community.legalName || '',
          taxId: community.taxId || '',
          formationDate: community.formationDate || ''
        };
      case 'contract':
        return {
          contractStartDate: community.contractStartDate || '',
          contractEndDate: community.contractEndDate || '',
          fiscalYearStart: community.fiscalYearStart || '',
          fiscalYearEnd: community.fiscalYearEnd || ''
        };
      case 'system':
        return {
          timeZone: community.timeZone || '',
          lastAuditDate: community.lastAuditDate || '',
          nextAuditDate: community.nextAuditDate || ''
        };
      default:
        return {};
    }
  };

  return (
    <div>
      {/* Community Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary mb-4">
              {community.displayName || community.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-royal-600 dark:bg-royal-500 text-white rounded-full text-sm font-medium theme-transition">
                {community.pcode}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium theme-transition ${getCommunityStatusColor(community.status)}`}>
                {formatStatus(community.status)}
              </span>
              {community.communityType && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border theme-transition ${getCommunityTypeColor(community.communityType)}`}>
                  {formatCommunityType(community.communityType)}
                </span>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="w-80 ml-6">
            <CommunitySearchBar
              onSearch={search}
              onClear={clearSearch}
              placeholder="Search: Community Code, State, Tax ID, Contract Start..."
              className="w-full"
            />
          </div>
        </div>
        
        {/* Search Results Indicator */}
        {isSearching && (
          <div className="mb-4">
            <SearchResultsIndicator
              searchTerm={searchTerm}
              resultCount={searchResults.length}
              onClear={clearSearch}
            />
          </div>
        )}
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <InfoCard 
          title="Basic Information" 
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          canEdit={true}
          onEdit={() => handleEditCard('basic')}
          highlightClass={getCardHighlightClass('basic')}
        >
          <InfoRow label="Community Code" value={community.pcode} />
          <InfoRow label="Display Name" value={community.displayName} />
          <InfoRow 
            label="Community Type" 
            value={formatCommunityType(community.communityType)} 
            chip={true}
            chipColor={getCommunityTypeColorName(community.communityType)}
          />
          <InfoRow label="Total Units" value={community.units || 0} />
          <InfoRow 
            label="Status" 
            value={formatStatusDisplay(community.status)} 
            chip={true}
            chipColor={getCommunityStatusColorName(community.status)}
          />
          <InfoRow 
            label="Sub Association" 
            value={community.isSubAssociation ? 'Yes' : 'No'} 
            chip={true}
            chipColor={community.isSubAssociation ? 'blue' : 'gray'}
          />
          {community.isSubAssociation && (
            <InfoRow label="Master Association" value={community.masterAssociation || 'Not Available'} />
          )}
        </InfoCard>

        {/* Geographic Information */}
        <InfoCard 
          title="Geographic Information" 
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          canEdit={true}
          onEdit={() => handleEditCard('geographic')}
          highlightClass={getCardHighlightClass('geographic')}
        >
          <InfoRow label="State" value={community.state} />
          <InfoRow label="City" value={community.city} />
          <InfoRow label="Address Line 1" value={community.addressLine1} />
          <InfoRow label="Address Line 2" value={community.addressLine2} />
          <InfoRow label="Postal Code" value={community.postalCode} />
          <InfoRow label="Country" value={community.country} />
        </InfoCard>

        {/* Legal Information */}
        <InfoCard 
          title="Legal Information" 
          icon={<DocumentTextIcon className="w-6 h-6" />}
          canEdit={true}
          onEdit={() => handleEditCard('legal')}
          highlightClass={getCardHighlightClass('legal')}
        >
          <InfoRow label="Legal Name" value={community.legalName} />
          <InfoRow label="Tax ID" value={community.taxId} />
          <InfoRow label="Formation Date" value={formatDate(community.formationDate)} />
        </InfoCard>

                {/* Contract Details */}
        <InfoCard 
          title="Contract Details"
          icon={<ClockIcon className="w-6 h-6" />}
          canEdit={true}
          onEdit={() => handleEditCard('contract')}
          highlightClass={getCardHighlightClass('contract')}
        >
          <InfoRow label="Contract Start" value={formatDate(community.contractStartDate)} />
          <InfoRow label="Contract End" value={formatDate(community.contractEndDate)} />
          <InfoRow label="Fiscal Year Start" value={formatDate(community.fiscalYearStart)} />
          <InfoRow label="Fiscal Year End" value={formatDate(community.fiscalYearEnd)} />
        </InfoCard>

        {/* System Information */}
        <InfoCard 
          title="System Information" 
          icon={<CogIcon className="w-6 h-6" />}
          canEdit={true}
          onEdit={() => handleEditCard('system')}
          highlightClass={getCardHighlightClass('system')}
        >
          <InfoRow label="Time Zone" value={community.timeZone} />
          <InfoRow label="Data Completeness" value={`${community.dataCompleteness || 0}%`} />
          <InfoRow label="Last Updated" value={formatDate(community.lastUpdated)} />
          <InfoRow label="Created Date" value={formatDate(community.createdDate)} />
          <InfoRow label="Record ID" value={community.id} />
          <InfoRow label="Last Audit Date" value={formatDate(community.lastAuditDate)} />
          <InfoRow label="Next Audit Due" value={formatDate(community.nextAuditDate)} />
        </InfoCard>

        {/* Management Team */}
        <div className={`bg-surface rounded-lg shadow-sm border border-primary theme-transition ${getCardHighlightClass('management')}`}>
          <ManagementTeam 
            community={community} 
            onRequestAssignment={() => {
              // Navigate to Forms > Community Assignment
              window.dispatchEvent(new CustomEvent('navigate:forms', { 
                detail: { form: 'community-assignment' } 
              }));
            }}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title={editingCard ? `${editingCard.charAt(0).toUpperCase() + editingCard.slice(1)} Information` : ''}
        fields={editingCard ? getFieldConfig(editingCard) : []}
        initialData={formData}
        onSave={handleSave}
        isLoading={isLoading}
        onFieldChange={(key, value) => {
          console.log('🏠 CommunityInfo onFieldChange called:', key, value);
          // Update the form data when Google Places populates fields
          setFormData(prev => {
            const newData = { ...prev, [key]: value };
            console.log('🏠 Updated formData:', newData);
            return newData;
          });
        }}
      />
    </div>
  );
};

export default CommunityInfo;
