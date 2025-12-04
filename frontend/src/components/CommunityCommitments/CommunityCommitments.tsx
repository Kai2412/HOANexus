import React, { useEffect, useState, useMemo } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { 
  Community, 
  CommitmentFee, 
  CommitmentFeeGroup,
  CreateCommitmentFeeData,
  UpdateCommitmentFeeData,
  DynamicDropChoice
} from '../../types';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EditModal from '../EditModal';
import type { FieldConfig } from '../EditModal';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
import InfoViewTemplate from '../InfoViewTemplate';

interface CommunityCommitmentsProps {
  community: Community | null;
}

const CommunityCommitments: React.FC<CommunityCommitmentsProps> = ({ community }) => {
  const [commitmentFees, setCommitmentFees] = useState<CommitmentFee[]>([]);
  const [commitmentTypeChoices, setCommitmentTypeChoices] = useState<DynamicDropChoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<CommitmentFee | null>(null);
  const [editingGroup, setEditingGroup] = useState<CommitmentFeeGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formEntryType, setFormEntryType] = useState<'Compensation' | 'Commitment'>('Compensation');

  // Group fees by CommitmentTypeID
  const groupedFees = useMemo(() => {
    const groups = new Map<string, CommitmentFeeGroup>();
    
    commitmentFees.forEach(fee => {
      if (!groups.has(fee.commitmentTypeId)) {
        groups.set(fee.commitmentTypeId, {
          commitmentTypeId: fee.commitmentTypeId,
          commitmentTypeName: fee.commitmentTypeName,
          displayOrder: fee.commitmentTypeDisplayOrder,
          fees: []
        });
      }
      groups.get(fee.commitmentTypeId)!.fees.push(fee);
    });

    // Sort groups by display order, then by name
    return Array.from(groups.values())
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.commitmentTypeName.localeCompare(b.commitmentTypeName);
      });
  }, [commitmentFees]);

  // Filter groups based on search term (real-time, partial match)
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) {
      return groupedFees;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return groupedFees.filter(group => {
      // Check if group name matches
      if (group.commitmentTypeName.toLowerCase().includes(searchLower)) {
        return true;
      }
      // Check if any fee name matches
      return group.fees.some(fee => 
        fee.feeName.toLowerCase().includes(searchLower)
      );
    });
  }, [groupedFees, searchTerm]);

  const hasSearchResults = searchTerm.trim().length > 0;

  useEffect(() => {
    if (!community?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fees, choicesData] = await Promise.all([
          dataService.getCommitmentFeesByCommunity(community.id),
          dataService.getDynamicDropChoices(['commitment-types'], true)
        ]);
        setCommitmentFees(fees);
        const choices = (choicesData['commitment-types'] || []) as DynamicDropChoice[];
        setCommitmentTypeChoices(choices.filter(c => c.IsActive));
      } catch (error) {
        logger.error('Error loading community commitments', 'CommunityCommitments', { communityId: community.id }, error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [community?.id]);

  // Open modal with one of three states:
  // 1. Add New: fee=null, group=null (user clicked "Add New" in header)
  // 2. Add to Group: fee=null, group=set (user clicked + on a group card)
  // 3. Edit Fee: fee=set, group=set (user clicked edit on a fee)
  const openEditModal = (fee: CommitmentFee | null, group: CommitmentFeeGroup | null) => {
    setEditingFee(fee);
    setEditingGroup(group);
    setFormEntryType(fee?.entryType || 'Compensation');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFee(null);
    setEditingGroup(null);
    setFormEntryType('Compensation');
  };

  const handleEntryTypeChange = (entryType: 'Compensation' | 'Commitment') => {
    setFormEntryType(entryType);
    // Clear value when switching types to avoid confusion
    // The EditModal will handle this through formData updates
  };

  const getFieldConfig = (fee: CommitmentFee | null, group: CommitmentFeeGroup | null, entryType?: 'Compensation' | 'Commitment'): FieldConfig[] => {
    // State 1: Add New (fee=null, group=null) - CommitmentTypeID is editable
    // State 2: Add to Group (fee=null, group=set) - CommitmentTypeID is disabled (locked to group)
    // State 3: Edit Fee (fee=set, group=set) - CommitmentTypeID is disabled (locked to fee)
    const isCommitmentTypeEditable = !fee && !group;
    
    // Determine EntryType: use provided entryType, or from fee, or default to Compensation
    const currentEntryType = entryType || fee?.entryType || 'Compensation';
    const isCompensation = currentEntryType === 'Compensation';
    
    return [
      {
        key: 'CommitmentTypeID',
        label: 'Commitment Type',
        type: 'select',
        required: true,
        disabled: !isCommitmentTypeEditable, // Disable if editing existing fee or adding to existing group
        options: commitmentTypeChoices.map(choice => ({
          value: choice.ChoiceID,
          label: choice.ChoiceValue
        }))
      },
      {
        key: 'EntryType',
        label: 'Entry Type',
        type: 'select',
        required: true,
        options: [
          { value: 'Compensation', label: 'Compensation' },
          { value: 'Commitment', label: 'Commitment' }
        ]
      },
      {
        key: 'FeeName',
        label: 'Name',
        type: 'text',
        required: true
      },
      {
        key: 'Value',
        label: 'Value',
        type: 'number',
        required: true, // Required when visible (Compensation)
        conditional: {
          dependsOn: 'EntryType',
          showWhen: 'Compensation'
        },
        validation: {
          min: 0
        }
      },
      {
        key: 'Notes',
        label: 'Notes',
        type: 'textarea',
        required: false
      }
    ];
  };

  const getInitialData = (fee: CommitmentFee | null, group: CommitmentFeeGroup | null): Record<string, any> => {
    if (fee) {
      const data: Record<string, any> = {
        CommitmentTypeID: fee.commitmentTypeId,
        EntryType: fee.entryType,
        FeeName: fee.feeName,
        Notes: fee.notes || ''
      };
      // Only include Value for Compensation entries
      if (fee.entryType === 'Compensation' && fee.value !== null) {
        data.Value = fee.value.toString();
      }
      return data;
    } else if (group) {
      // New fee for this group
      return {
        CommitmentTypeID: group.commitmentTypeId,
        EntryType: 'Compensation', // Default to Compensation
        FeeName: '',
        Value: '',
        Notes: ''
      };
    }
    return {
      CommitmentTypeID: '',
      EntryType: 'Compensation', // Default to Compensation
      FeeName: '',
      Value: '',
      Notes: ''
    };
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!community?.id) {
      throw new Error('Community is required');
    }

    setIsSaving(true);
    try {
      // Determine the mode: Edit Fee, Add to Group, or Add New
      const isEditMode = !!editingFee;
      const isAddToGroupMode = !!editingGroup && !editingFee;
      const isAddNewMode = !editingFee && !editingGroup;

      // Validate required fields
      if (!data.CommitmentTypeID) {
        throw new Error('Commitment Type is required');
      }

      if (!data.EntryType || !['Compensation', 'Commitment'].includes(data.EntryType)) {
        throw new Error('Entry Type is required and must be Compensation or Commitment');
      }

      if (!data.FeeName || data.FeeName.trim() === '') {
        throw new Error('Name is required');
      }

      // Validate Value based on EntryType
      const entryType = data.EntryType as 'Compensation' | 'Commitment';
      let value: number | null = null;
      
      if (entryType === 'Compensation') {
        // For Compensation, Value is required and must be a number
        if (!data.Value || data.Value === '') {
          throw new Error('Value is required for Compensation entries');
        }
        const numValue = parseFloat(data.Value);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Value must be a valid number greater than or equal to 0');
        }
        value = numValue;
      }
      // For Commitment, Value is null (not used)

      const notes = data.Notes?.trim() || null;

      if (isEditMode) {
        // Mode 1: Edit Fee in Group
        // Update existing fee
        const updateData: UpdateCommitmentFeeData = {
          CommitmentTypeID: data.CommitmentTypeID,
          EntryType: entryType,
          FeeName: data.FeeName.trim(),
          Value: value,
          Notes: notes
        };
        await dataService.updateCommitmentFee(editingFee!.id, updateData);
      } else {
        // Mode 2: Add New to Group OR Mode 3: Add New
        // Create new fee
        const createData: CreateCommitmentFeeData = {
          CommunityID: community.id,
          CommitmentTypeID: data.CommitmentTypeID,
          EntryType: entryType,
          FeeName: data.FeeName.trim(),
          Value: value,
          Notes: notes
        };
        await dataService.createCommitmentFee(createData);
      }

      // Reload data after successful save
      const fees = await dataService.getCommitmentFeesByCommunity(community.id);
      setCommitmentFees(fees);

      // Close modal only after successful save
      closeEditModal();
    } catch (error) {
      logger.error('Error saving commitment fee', 'CommunityCommitments', { 
        mode: editingFee ? 'Edit' : editingGroup ? 'AddToGroup' : 'AddNew',
        fee: editingFee,
        group: editingGroup 
      }, error as Error);
      // Re-throw error so EditModal can display it
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (fee: CommitmentFee) => {
    if (!window.confirm(`Are you sure you want to delete "${fee.feeName}"?`)) {
      return;
    }

    try {
      await dataService.deleteCommitmentFee(fee.id);
      // Reload data
      const fees = await dataService.getCommitmentFeesByCommunity(community.id);
      setCommitmentFees(fees);
    } catch (error) {
      logger.error('Error deleting commitment fee', 'CommunityCommitments', { feeId: fee.id }, error as Error);
      alert('Failed to delete commitment fee. Please try again.');
    }
  };

  const handleAddNew = () => {
    // Open modal with no existing fee or group (new commitment)
    openEditModal(null, null);
  };

  const headerContent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Community Commitments</h1>
            <p className="text-sm text-secondary mt-1">
              {community?.displayName || community?.legalName || 'Select a community'}
            </p>
          </div>
        </div>
        {community && (
          <button
            type="button"
            onClick={handleAddNew}
            className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add New</span>
          </button>
        )}
      </div>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-tertiary" />
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearchTerm('');
            }
          }}
          placeholder="Search commitments by type or fee name..."
          className="w-full pl-12 pr-12 py-3 border border-primary rounded-lg bg-surface text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-royal-600 focus:border-royal-600 transition-all"
          autoComplete="off"
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  );

  if (!community) {
    return (
      <InfoViewTemplate header={headerContent} maxHeightOffset={300}>
        <div className="text-center py-12">
          <p className="text-secondary">Please select a community to view commitments.</p>
        </div>
      </InfoViewTemplate>
    );
  }

  if (isLoading) {
    return (
      <InfoViewTemplate header={headerContent} maxHeightOffset={300}>
        <div className="text-center py-12">
          <p className="text-secondary">Loading commitments...</p>
        </div>
      </InfoViewTemplate>
    );
  }

  return (
    <>
      <InfoViewTemplate
        header={headerContent}
        hasSearchResults={hasSearchResults}
        maxHeightOffset={300}
        contentClassName="pb-8"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <div
              key={group.commitmentTypeId}
              className="bg-surface rounded-lg shadow-sm border border-primary theme-transition hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">{group.commitmentTypeName}</h3>
                  <button
                    type="button"
                    onClick={() => openEditModal(null, group)}
                    className="p-2 rounded-md text-tertiary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-colors flex-shrink-0"
                    aria-label={`Add fee to ${group.commitmentTypeName}`}
                    title="Add Fee"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                <hr className="mb-4 border-primary" />
                <div className="space-y-4">
                  {group.fees.length === 0 ? (
                    <p className="text-sm text-secondary italic">No fees added yet.</p>
                  ) : (
                    group.fees.map((fee) => (
                      <div key={fee.id} className="border-b border-primary last:border-b-0 pb-3 last:pb-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <span className="text-sm font-medium text-primary">{fee.feeName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  fee.entryType === 'Compensation' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                }`}>
                                  {fee.entryType}
                                </span>
                              </div>
                              {fee.entryType === 'Compensation' && fee.value !== null && (
                                <span className="text-sm font-bold text-primary ml-2">
                                  ${fee.value.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {fee.notes && (
                              <p className="text-xs text-secondary italic mt-1">{fee.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(fee, group)}
                            className="p-1.5 rounded-md text-tertiary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-colors"
                            aria-label={`Edit ${fee.feeName}`}
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(fee)}
                            className="p-1.5 rounded-md text-tertiary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label={`Delete ${fee.feeName}`}
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary">
              {commitmentFees.length === 0 
                ? 'No commitments found. Add a commitment fee to get started.' 
                : 'No commitments match your search.'}
            </p>
          </div>
        )}
      </InfoViewTemplate>

      <EditModal
        key={`${isEditModalOpen}-${formEntryType}`} // Force re-render when EntryType changes
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={
          editingFee 
            ? `Fee: ${editingFee.feeName}` // State 3: Edit Fee
            : editingGroup 
            ? `Add Fee to: ${editingGroup.commitmentTypeName}` // State 2: Add to Group
            : 'New Commitment Fee' // State 1: Add New
        }
        fields={getFieldConfig(editingFee, editingGroup, formEntryType)}
        initialData={getInitialData(editingFee, editingGroup)}
        onSave={handleSave}
        isLoading={isSaving}
        onFieldChange={(key, value) => {
          if (key === 'EntryType') {
            handleEntryTypeChange(value as 'Compensation' | 'Commitment');
          }
        }}
      />
    </>
  );
};

export default CommunityCommitments;

