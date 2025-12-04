import React, { useEffect, useState, useMemo } from 'react';
import { CurrencyDollarIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { Community, FeeMaster, CommunityFeeVariance, FeeWithVariance, CreateCommunityFeeVarianceData, UpdateCommunityFeeVarianceData } from '../../types';
import { SearchResultsIndicator } from '../CommunitySearchBar';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EditModal from '../EditModal';
import type { FieldConfig } from '../EditModal';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
import InfoViewTemplate from '../InfoViewTemplate';

interface CommunityFeesProps {
  community: Community | null;
}

const CommunityFees: React.FC<CommunityFeesProps> = ({ community }) => {
  const [feeMasters, setFeeMasters] = useState<FeeMaster[]>([]);
  const [variances, setVariances] = useState<CommunityFeeVariance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeWithVariance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Combine master fees with variances
  const feesWithVariances = useMemo(() => {
    return feeMasters.map(fee => {
      const variance = variances.find(v => v.feeMasterId === fee.id);
      let effectiveAmount: number | null = fee.defaultAmount;
      
      if (variance) {
        if (variance.varianceType === 'Not Billed') {
          effectiveAmount = null;
        } else if (variance.varianceType === 'Custom' && variance.customAmount !== null) {
          effectiveAmount = variance.customAmount;
        } else if (variance.varianceType === 'Standard') {
          effectiveAmount = fee.defaultAmount;
        }
      }

      return {
        feeMasterId: fee.id,
        feeName: fee.feeName,
        defaultAmount: fee.defaultAmount,
        displayOrder: fee.displayOrder,
        variance: variance || null,
        effectiveAmount,
        isVariance: !!variance
      };
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [feeMasters, variances]);

  // Filter fees based on search term (real-time, partial match)
  const filteredFees = useMemo(() => {
    if (!searchTerm.trim()) {
      return feesWithVariances;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return feesWithVariances.filter(fee => 
      fee.feeName.toLowerCase().includes(searchLower)
    );
  }, [feesWithVariances, searchTerm]);

  const hasSearchResults = searchTerm.trim().length > 0;

  useEffect(() => {
    if (!community?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fees, vars] = await Promise.all([
          dataService.getAllFeeMasters(),
          dataService.getCommunityFeeVariancesByCommunity(community.id)
        ]);
        setFeeMasters(fees.filter(f => f.isActive));
        setVariances(vars);
      } catch (error) {
        logger.error('Error loading community fees', 'CommunityFees', { communityId: community.id }, error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [community?.id]);

  const openEditModal = (fee: FeeWithVariance) => {
    setEditingFee(fee);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFee(null);
  };

  const getFieldConfig = (fee: FeeWithVariance): FieldConfig[] => {
    return [
      {
        key: 'VarianceType',
        label: 'Variance Type',
        type: 'select',
        required: true,
        options: [
          { value: 'Standard', label: 'Standard (Use Master Default)' },
          { value: 'Not Billed', label: 'Not Billed' },
          { value: 'Custom', label: 'Custom Amount' }
        ]
      },
      {
        key: 'CustomAmount',
        label: 'Custom Amount',
        type: 'number',
        required: false, // Conditionally required via conditionalRequired
        conditional: {
          dependsOn: 'VarianceType',
          showWhen: 'Custom'
        },
        conditionalRequired: {
          dependsOn: 'VarianceType',
          requiredWhen: 'Custom'
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

  const getInitialData = (fee: FeeWithVariance): Record<string, any> => {
    const variance = fee.variance;
    return {
      VarianceType: variance?.varianceType || 'Standard',
      CustomAmount: variance?.customAmount?.toString() || fee.defaultAmount.toString(),
      Notes: variance?.notes || ''
    };
  };

  const handleSave = async (data: Record<string, any>) => {
    if (!community?.id || !editingFee) return;

    const varianceType = data.VarianceType as 'Standard' | 'Not Billed' | 'Custom';
    
    // Validate CustomAmount when VarianceType is Custom
    if (varianceType === 'Custom') {
      const customAmount = parseFloat(data.CustomAmount);
      if (isNaN(customAmount) || customAmount < 0) {
        throw new Error('Custom Amount is required and must be a valid number when Variance Type is Custom');
      }
    }

    setIsSaving(true);
    try {
      const variance = editingFee.variance;
      const customAmount = varianceType === 'Custom' ? parseFloat(data.CustomAmount) : null;
      const notes = data.Notes?.trim() || null;

      // If Standard with no notes, delete the variance (clean up unnecessary records)
      if (varianceType === 'Standard' && !notes) {
        if (variance) {
          // Delete existing variance - no need to keep it if it's just Standard with no notes
          await dataService.deleteCommunityFeeVariance(variance.id);
        }
        // If no variance exists and it's Standard with no notes, do nothing (no record needed)
      } else {
        // Create or update variance for Custom, Not Billed, or Standard with notes
        if (variance) {
          // Update existing variance
          const updateData: UpdateCommunityFeeVarianceData = {
            VarianceType: varianceType,
            CustomAmount: customAmount,
            Notes: notes
          };
          await dataService.updateCommunityFeeVariance(variance.id, updateData);
        } else {
          // Create new variance
          const createData: CreateCommunityFeeVarianceData = {
            CommunityID: community.id,
            FeeMasterID: editingFee.feeMasterId,
            VarianceType: varianceType,
            CustomAmount: customAmount,
            Notes: notes
          };
          await dataService.createCommunityFeeVariance(createData);
        }
      }

      // Reload data
      const [fees, vars] = await Promise.all([
        dataService.getAllFeeMasters(),
        dataService.getCommunityFeeVariancesByCommunity(community.id)
      ]);
      setFeeMasters(fees.filter(f => f.isActive));
      setVariances(vars);

      closeEditModal();
    } catch (error) {
      logger.error('Error saving fee variance', 'CommunityFees', { fee: editingFee }, error as Error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const getVarianceBadge = (fee: FeeWithVariance) => {
    // Determine the variance type (default to 'Standard' if no variance exists)
    const varianceType = fee.variance?.varianceType || 'Standard';
    
    const badges = {
      'Custom': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      'Not Billed': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      'Standard': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
    };

    const labels = {
      'Custom': 'Custom',
      'Not Billed': 'Not Billed',
      'Standard': 'Standard'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[varianceType]}`}>
        {labels[varianceType]}
      </span>
    );
  };

  const headerContent = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Community Fees</h1>
            <p className="text-sm text-secondary mt-1">
              {community?.displayName || community?.legalName || 'Select a community'}
            </p>
          </div>
        </div>
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
          placeholder="Search fees by name..."
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
      {hasSearchResults && (
        <SearchResultsIndicator
          count={filteredFees.length}
          total={feeMasters.length}
          searchTerm={searchTerm}
        />
      )}
    </>
  );

  if (!community) {
    return (
      <InfoViewTemplate header={headerContent} maxHeightOffset={300}>
        <div className="text-center py-12">
          <p className="text-secondary">Please select a community to view fees.</p>
        </div>
      </InfoViewTemplate>
    );
  }

  if (isLoading) {
    return (
      <InfoViewTemplate header={headerContent} maxHeightOffset={300}>
        <div className="text-center py-12">
          <p className="text-secondary">Loading fees...</p>
        </div>
      </InfoViewTemplate>
    );
  }

  const displayFees = filteredFees;

  return (
    <>
      <InfoViewTemplate
        header={headerContent}
        hasSearchResults={hasSearchResults}
        maxHeightOffset={300}
        contentClassName="pb-8"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayFees.map((fee) => (
            <div
              key={fee.feeMasterId}
              className="bg-surface rounded-lg shadow-sm border border-primary theme-transition hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-primary truncate">{fee.feeName}</h3>
                    {getVarianceBadge(fee)}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(fee)}
                    className="p-2 rounded-md text-tertiary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-colors flex-shrink-0"
                    aria-label={`Edit ${fee.feeName}`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
                <hr className="mb-4 border-primary" />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary">Amount:</span>
                    <div className="flex items-center space-x-2">
                      {fee.effectiveAmount !== null ? (
                        <span className="text-lg font-bold text-primary">${fee.effectiveAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">Not Billed</span>
                      )}
                      {fee.isVariance && fee.effectiveAmount !== null && fee.effectiveAmount !== fee.defaultAmount && (
                        <span className="text-xs text-tertiary line-through">${fee.defaultAmount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {fee.variance?.notes && (
                    <div className="mt-2 pt-2 border-t border-primary">
                      <p className="text-xs text-secondary italic">{fee.variance.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {displayFees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary">No fees found.</p>
          </div>
        )}
      </InfoViewTemplate>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={editingFee ? editingFee.feeName : 'Fee'}
        fields={editingFee ? getFieldConfig(editingFee) : []}
        initialData={editingFee ? getInitialData(editingFee) : {}}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </>
  );
};

export default CommunityFees;

