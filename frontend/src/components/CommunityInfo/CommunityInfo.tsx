import React, { useEffect, useMemo, useState } from 'react';
import { BuildingOfficeIcon, DocumentTextIcon, ClockIcon, CogIcon, PencilIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { Community, UpdateCommunityData } from '../../types';
import { getCommunityStatusColor, getCommunityStatusColorName, getCommunityTypeColor, getCommunityTypeColorName } from '../../utils/statusColors';
import { CommunitySearchBar, SearchResultsIndicator } from '../CommunitySearchBar';
import { useCommunitySearch } from '../../hooks/useCommunitySearch';
import EditModal from '../EditModal';
import type { FieldConfig } from '../EditModal';
import dataService from '../../services/dataService';

interface CommunityInfoProps {
  community: Community;
  onCommunityUpdate?: (updatedCommunity: Community) => void;
}

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  highlightClass?: string;
  onEdit?: () => void;
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  chip?: boolean;
  chipColor?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';
}

type ChoiceOption = {
  value: string;
  label: string;
  isDefault?: boolean;
};

const CHOICE_COLUMNS_BY_CARD: Record<'basic' | 'geographic' | 'legal' | 'contract' | 'system', string[]> = {
  basic: ['ClientType', 'ServiceType', 'ManagementType', 'DevelopmentStage', 'CommunityStatus'],
  geographic: [],
  legal: ['AcquisitionType'],
  contract: [],
  system: []
};

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children, highlightClass = '', onEdit }) => (
  <div className={`bg-surface rounded-lg shadow-sm border border-primary theme-transition ${highlightClass}`}>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-royal-600 dark:text-royal-400">{icon}</div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-md text-tertiary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-50 dark:hover:bg-royal-900/20 transition-colors"
            aria-label={`Edit ${title}`}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <hr className="mb-4 border-primary" />
      <div className="space-y-3">{children}</div>
    </div>
  </div>
);

const InfoRow: React.FC<InfoRowProps> = ({ label, value, chip = false, chipColor = 'gray' }) => {
  const displayValue = value ?? 'Not Available';
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium theme-transition ${chipColors[chipColor]}`}>{displayValue}</span>
      ) : (
        <span className="text-sm font-semibold text-primary text-right break-words">{displayValue}</span>
      )}
    </div>
  );
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not Set';
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? 'Invalid Date'
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatChipValue = (text: string | null | undefined) => text ?? 'Unknown';

const CommunityInfo: React.FC<CommunityInfoProps> = ({ community, onCommunityUpdate }) => {
  const statusValue = community.communityStatus ?? (community.active ? 'Active' : 'Inactive');
  const clientTypeValue = community.clientType ?? 'Unknown';
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<'basic' | 'geographic' | 'legal' | 'contract' | 'system' | null>(null);
  const [modalInitialData, setModalInitialData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [choiceOptions, setChoiceOptions] = useState<Record<string, ChoiceOption[]>>({});
  const [isChoiceLoading, setIsChoiceLoading] = useState(false);
  const activeChoiceColumns = editingCard ? CHOICE_COLUMNS_BY_CARD[editingCard] ?? [] : [];
  const searchableData = useMemo(() => {
    const addField = (
      labels: string[],
      fieldLabel: string,
      value: string | number | boolean | null | undefined
    ) => {
      const normalizedLabel = fieldLabel.trim();
      if (normalizedLabel) {
        labels.push(normalizedLabel);
      }

      if (value === null || value === undefined) return;

      const text = String(value).trim();
      if (!text) return;

      labels.push(text);
      if (normalizedLabel) {
        labels.push(`${normalizedLabel}: ${text}`);
      }
    };

    const basicLabels: string[] = [];
    addField(basicLabels, 'Community Code', community.propertyCode);
    addField(basicLabels, 'Display Name', community.displayName);
    addField(basicLabels, 'Legal Name', community.legalName);
    addField(basicLabels, 'Client Type', formatChipValue(clientTypeValue));
    addField(basicLabels, 'Service Type', community.serviceType);
    addField(basicLabels, 'Management Type', community.managementType);
    addField(basicLabels, 'Development Stage', community.developmentStage);
    addField(basicLabels, 'Community Status', formatChipValue(statusValue));
    addField(basicLabels, 'Built Out Units', community.builtOutUnits);
    addField(basicLabels, 'Market', community.market);
    addField(basicLabels, 'Office', community.office);
    addField(basicLabels, 'Preferred Contact Info', community.preferredContactInfo);
    addField(basicLabels, 'Website', community.website);

    const geographicLabels: string[] = [];
    addField(geographicLabels, 'Address Line 1', community.addressLine1);
    addField(geographicLabels, 'Address Line 2', community.addressLine2);
    addField(geographicLabels, 'City', community.city);
    addField(geographicLabels, 'State', community.state);
    addField(geographicLabels, 'Postal Code', community.postalCode);

    const legalLabels: string[] = [];
    addField(legalLabels, 'Legal Name', community.legalName);
    addField(legalLabels, 'Tax ID', community.taxId);
    addField(legalLabels, 'State Tax ID', community.stateTaxId);
    addField(legalLabels, 'SOS File Number', community.sosFileNumber);
    addField(legalLabels, 'Tax Return Type', community.taxReturnType);
    addField(legalLabels, 'Acquisition Type', community.acquisitionType);

    const contractLabels: string[] = [];
    addField(contractLabels, 'Contract Start', formatDate(community.contractStart));
    addField(contractLabels, 'Contract End', formatDate(community.contractEnd));

    const systemLabels: string[] = [];
    addField(systemLabels, 'Record ID', community.id);
    addField(systemLabels, 'Third Party Identifier', community.thirdPartyIdentifier);
    addField(systemLabels, 'Active', community.active ? 'Active' : 'Inactive');
    addField(systemLabels, 'Created On', formatDate(community.createdOn));
    addField(systemLabels, 'Created By', community.createdByName || community.createdBy || 'Not available');
    addField(systemLabels, 'Last Modified On', formatDate(community.modifiedOn));
    addField(systemLabels, 'Last Modified By', community.modifiedByName || community.modifiedBy || 'Not available');

    return [
      { id: 'basic', labels: basicLabels },
      { id: 'geographic', labels: geographicLabels },
      { id: 'legal', labels: legalLabels },
      { id: 'contracts', labels: contractLabels },
      { id: 'system', labels: systemLabels }
    ];
  }, [community, statusValue, clientTypeValue]);

  const { searchTerm, searchResults, isSearching, search, clearSearch, getCardHighlightClass } = useCommunitySearch({
    data: searchableData.map((entry) => ({
      ...entry,
      labels: entry.labels.map((label: string) => label.toString())
    }))
  });

  useEffect(() => {
    if (!isEditModalOpen || !editingCard) {
      return;
    }

    const columnsForCard = CHOICE_COLUMNS_BY_CARD[editingCard] ?? [];
    if (columnsForCard.length === 0) {
      return;
    }

    const missingColumns = columnsForCard.filter((column) => choiceOptions[column] === undefined);
    if (missingColumns.length === 0) {
      return;
    }

    // Map column names to GroupIDs
    const columnToGroupId: Record<string, string> = {
      'ClientType': 'client-types',
      'ServiceType': 'service-types',
      'ManagementType': 'management-types',
      'DevelopmentStage': 'development-stages',
      'AcquisitionType': 'acquisition-types',
      'CommunityStatus': 'status' // Assuming CommunityStatus maps to the status group
    };

    // Get GroupIDs for missing columns
    const groupIds = missingColumns
      .map((column) => columnToGroupId[column])
      .filter((groupId): groupId is string => groupId !== undefined);

    if (groupIds.length === 0) {
      return;
    }

    let isCancelled = false;
    setIsChoiceLoading(true);

    dataService
      .getDynamicDropChoices(groupIds)
      .then((response) => {
        if (isCancelled) return;
        setChoiceOptions((prev) => {
          const next = { ...prev };
          // Map response back to column names
          missingColumns.forEach((column) => {
            const groupId = columnToGroupId[column];
            if (groupId && response[groupId]) {
              next[column] = response[groupId].map((choice) => ({
                value: choice.ChoiceValue,
                label: choice.ChoiceValue,
                isDefault: choice.IsDefault
              }));
            } else {
              next[column] = [];
            }
          });
          return next;
        });
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error('Failed to load dynamic drop choices', error);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsChoiceLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isEditModalOpen, editingCard, choiceOptions]);

  const buildOptions = (column: string): { value: string; label: string }[] => {
    const dynamic = choiceOptions[column];
    if (!dynamic) {
      return [];
    }
    return dynamic.map((choice) => ({ value: choice.value, label: choice.label }));
  };

  const hasOptions = (column: string): boolean =>
    Array.isArray(choiceOptions[column]) && choiceOptions[column]!.length > 0;

  const getPlaceholderText = (column: string, label: string) => {
    if (isChoiceLoading && activeChoiceColumns.includes(column) && choiceOptions[column] === undefined) {
      return `Loading ${label} options...`;
    }
    return hasOptions(column) ? `Select ${label}` : `No ${label} choices configured`;
  };

  const getFieldConfig = (card: 'basic' | 'geographic' | 'legal' | 'contract' | 'system'): FieldConfig[] => {
    if (card === 'basic') {
      return [
      {
        key: 'PropertyCode',
        label: 'Community Code',
        type: 'text',
        placeholder: 'Enter community code'
      },
      {
        key: 'DisplayName',
        label: 'Display Name',
        type: 'text',
        required: true,
        placeholder: 'Enter display name'
      },
      {
        key: 'LegalName',
        label: 'Legal Name',
        type: 'text',
        placeholder: 'Enter legal name'
      },
      {
        key: 'ClientType',
        label: 'Client Type',
        type: 'select',
        required: true,
        options: buildOptions('ClientType'),
        placeholder: getPlaceholderText('ClientType', 'Client Type')
      },
      {
        key: 'ServiceType',
        label: 'Service Type',
        type: 'select',
        options: buildOptions('ServiceType'),
        placeholder: getPlaceholderText('ServiceType', 'Service Type')
      },
      {
        key: 'ManagementType',
        label: 'Management Type',
        type: 'select',
        options: buildOptions('ManagementType'),
        placeholder: getPlaceholderText('ManagementType', 'Management Type')
      },
      {
        key: 'DevelopmentStage',
        label: 'Development Stage',
        type: 'select',
        options: buildOptions('DevelopmentStage'),
        placeholder: getPlaceholderText('DevelopmentStage', 'Development Stage')
      },
      {
        key: 'CommunityStatus',
        label: 'Community Status',
        type: 'select',
        options: buildOptions('CommunityStatus'),
        placeholder: getPlaceholderText('CommunityStatus', 'Community Status')
      },
      {
        key: 'BuiltOutUnits',
        label: 'Built Out Units',
        type: 'number',
        placeholder: 'Enter number of units'
      },
      {
        key: 'Market',
        label: 'Market',
        type: 'text',
        placeholder: 'Enter market name'
      },
      {
        key: 'Office',
        label: 'Office',
        type: 'text',
        placeholder: 'Enter office'
      },
      {
        key: 'PreferredContactInfo',
        label: 'Preferred Contact Info',
        type: 'text',
        placeholder: 'Enter preferred contact info'
      },
      {
        key: 'Website',
        label: 'Website',
        type: 'text',
        placeholder: 'https://example.com'
      }
    ];
    }

    if (card === 'geographic') {
      return [
        {
          key: 'AddressSearch',
          label: 'Search Address',
          type: 'places-autocomplete',
          placeholder: 'Search for an address'
        },
        {
          key: 'Address',
          label: 'Address Line 1',
          type: 'text',
          required: true,
          placeholder: 'Enter street address'
        },
        {
          key: 'Address2',
          label: 'Address Line 2',
          type: 'text',
          placeholder: 'Apartment, suite, etc. (optional)'
        },
        {
          key: 'City',
          label: 'City',
          type: 'text',
          required: true,
          placeholder: 'Enter city'
        },
        {
          key: 'State',
          label: 'State',
          type: 'text',
          required: true,
          placeholder: 'Enter state abbreviation (e.g., CA)'
        },
        {
          key: 'Zipcode',
          label: 'Postal Code',
          type: 'text',
          required: true,
          placeholder: 'Enter postal code'
        }
      ];
    }

    if (card === 'legal') {
      return [
        {
          key: 'TaxID',
          label: 'Tax ID',
          type: 'text',
          placeholder: 'Enter tax ID'
        },
        {
          key: 'StateTaxID',
          label: 'State Tax ID',
          type: 'text',
          placeholder: 'Enter state tax ID'
        },
        {
          key: 'SOSFileNumber',
          label: 'SOS File Number',
          type: 'text',
          placeholder: 'Enter SOS file number'
        },
        {
          key: 'TaxReturnType',
          label: 'Tax Return Type',
          type: 'text',
          placeholder: 'Enter tax return type'
        },
        {
          key: 'AcquisitionType',
          label: 'Acquisition Type',
          type: 'select',
          options: buildOptions('AcquisitionType'),
          placeholder: getPlaceholderText('AcquisitionType', 'Acquisition Type')
        }
      ];
    }

    if (card === 'contract') {
      return [
        {
          key: 'ContractStart',
          label: 'Contract Start',
          type: 'date'
        },
        {
          key: 'ContractEnd',
          label: 'Contract End',
          type: 'date'
        }
      ];
    }

    if (card === 'system') {
      return [
        {
          key: 'Active',
          label: 'Active',
          type: 'boolean'
        },
        {
          key: 'ThirdPartyIdentifier',
          label: 'Third Party Identifier',
          type: 'text',
          placeholder: 'Enter third party identifier'
        }
      ];
    }

    return [];
  };

  const getInitialData = (card: 'basic' | 'geographic' | 'legal' | 'contract' | 'system'): Record<string, any> => {
    if (card === 'basic') {
      return {
        PropertyCode: community.propertyCode ?? '',
        DisplayName: community.displayName ?? '',
        LegalName: community.legalName ?? '',
        ClientType: community.clientType ?? '',
        ServiceType: community.serviceType ?? '',
        ManagementType: community.managementType ?? '',
        DevelopmentStage: community.developmentStage ?? '',
        CommunityStatus: community.communityStatus ?? '',
        BuiltOutUnits: community.builtOutUnits ?? '',
        Market: community.market ?? '',
        Office: community.office ?? '',
        PreferredContactInfo: community.preferredContactInfo ?? '',
        Website: community.website ?? ''
      };
    }

    if (card === 'geographic') {
      return {
        AddressSearch: community.addressLine1 ?? '',
        Address: community.addressLine1 ?? '',
        Address2: community.addressLine2 ?? '',
        City: community.city ?? '',
        State: community.state ?? '',
        Zipcode: community.postalCode ?? ''
      };
    }

    if (card === 'legal') {
      return {
        TaxID: community.taxId ?? '',
        StateTaxID: community.stateTaxId ?? '',
        SOSFileNumber: community.sosFileNumber ?? '',
        TaxReturnType: community.taxReturnType ?? '',
        AcquisitionType: community.acquisitionType ?? ''
      };
    }

    if (card === 'contract') {
      return {
        ContractStart: community.contractStart ?? '',
        ContractEnd: community.contractEnd ?? ''
      };
    }

    if (card === 'system') {
      return {
        Active: community.active ?? false,
        ThirdPartyIdentifier: community.thirdPartyIdentifier ?? ''
      };
    }

    return {};
  };

  const openEditModal = (card: 'basic' | 'geographic' | 'legal' | 'contract' | 'system') => {
    setEditingCard(card);
    setModalInitialData(getInitialData(card));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCard(null);
    setModalInitialData({});
  };

  const handleSave = async (formValues: Record<string, any>) => {
    if (!editingCard) return;

    const normalizeString = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      const trimmed = String(value).trim();
      return trimmed === '' ? null : trimmed;
    };

    const toNumberOrNull = (value: any): number | null => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    try {
      setIsSaving(true);

      let updatedCommunity: Community | undefined;

      if (editingCard === 'basic') {
        const payload: UpdateCommunityData = {
          PropertyCode: normalizeString(formValues.PropertyCode),
          DisplayName: normalizeString(formValues.DisplayName),
          LegalName: normalizeString(formValues.LegalName),
          ClientType: normalizeString(formValues.ClientType),
          ServiceType: normalizeString(formValues.ServiceType),
          ManagementType: normalizeString(formValues.ManagementType),
          DevelopmentStage: normalizeString(formValues.DevelopmentStage),
          CommunityStatus: normalizeString(formValues.CommunityStatus),
          BuiltOutUnits: toNumberOrNull(formValues.BuiltOutUnits),
          Market: normalizeString(formValues.Market),
          Office: normalizeString(formValues.Office),
          PreferredContactInfo: normalizeString(formValues.PreferredContactInfo),
          Website: normalizeString(formValues.Website)
        };

        updatedCommunity = await dataService.updateCommunity(community.id, payload);
      } else if (editingCard === 'geographic') {
        const stateValue = normalizeString(formValues.State);

        const payload: UpdateCommunityData = {
          Address: normalizeString(formValues.Address),
          Address2: normalizeString(formValues.Address2),
          City: normalizeString(formValues.City),
          State: stateValue ? stateValue.toUpperCase() : null,
          Zipcode: normalizeString(formValues.Zipcode)
        };

        updatedCommunity = await dataService.updateCommunity(community.id, payload);
      } else if (editingCard === 'legal') {
        const payload: UpdateCommunityData = {
          TaxID: normalizeString(formValues.TaxID),
          StateTaxID: normalizeString(formValues.StateTaxID),
          SOSFileNumber: normalizeString(formValues.SOSFileNumber),
          TaxReturnType: normalizeString(formValues.TaxReturnType),
          AcquisitionType: normalizeString(formValues.AcquisitionType)
        };

        updatedCommunity = await dataService.updateCommunity(community.id, payload);
      } else if (editingCard === 'contract') {
        const payload: UpdateCommunityData = {
          ContractStart: formValues.ContractStart || null,
          ContractEnd: formValues.ContractEnd || null
        };

        updatedCommunity = await dataService.updateCommunity(community.id, payload);
      } else if (editingCard === 'system') {
        const payload: UpdateCommunityData = {
          Active: Boolean(formValues.Active),
          ThirdPartyIdentifier: normalizeString(formValues.ThirdPartyIdentifier)
        };

        updatedCommunity = await dataService.updateCommunity(community.id, payload);
      }

      if (updatedCommunity) {
        onCommunityUpdate?.(updatedCommunity);
      }

      closeEditModal();
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle =
    editingCard === 'basic'
      ? 'Basic Information'
      : editingCard === 'geographic'
        ? 'Geographic Information'
      : editingCard === 'legal'
          ? 'Legal Information'
          : editingCard === 'contract'
            ? 'Contract Information'
          : editingCard === 'system'
            ? 'System Information'
            : '';

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">{community.displayName ?? community.legalName ?? 'Unnamed Community'}</h1>
            <div className="flex flex-wrap gap-3">
              {community.propertyCode && (
                <span className="px-3 py-1 bg-royal-600 dark:bg-royal-500 text-white rounded-full text-sm font-medium theme-transition">
                  {community.propertyCode}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium theme-transition ${getCommunityStatusColor(statusValue)}`}
              >
                {formatChipValue(statusValue)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border theme-transition ${getCommunityTypeColor(clientTypeValue)}`}
              >
                {formatChipValue(clientTypeValue)}
              </span>
            </div>
          </div>
          <div className="w-full md:w-80">
            <CommunitySearchBar
              onSearch={search}
              onClear={clearSearch}
              placeholder="Search by code, name, address, status..."
              className="w-full"
            />
          </div>
        </div>
        <SearchResultsIndicator searchTerm={searchTerm} resultCount={searchResults.length} onClear={clearSearch} />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard
          title="Basic Information"
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          highlightClass={getCardHighlightClass('basic')}
          onEdit={() => openEditModal('basic')}
        >
          <InfoRow label="Community Code" value={community.propertyCode} />
          <InfoRow label="Display Name" value={community.displayName} />
          <InfoRow label="Legal Name" value={community.legalName} />
          <InfoRow
            label="Client Type"
            value={formatChipValue(clientTypeValue)}
            chip
            chipColor={getCommunityTypeColorName(clientTypeValue)}
          />
          <InfoRow label="Service Type" value={community.serviceType} />
          <InfoRow label="Management Type" value={community.managementType} />
          <InfoRow label="Development Stage" value={community.developmentStage} />
          <InfoRow
            label="Community Status"
            value={formatChipValue(statusValue)}
            chip
            chipColor={getCommunityStatusColorName(statusValue)}
          />
          <InfoRow label="Built Out Units" value={community.builtOutUnits} />
          <InfoRow label="Market" value={community.market} />
          <InfoRow label="Office" value={community.office} />
          <InfoRow label="Preferred Contact Info" value={community.preferredContactInfo} />
          <InfoRow label="Website" value={community.website} />
        </InfoCard>

        <InfoCard
          title="Geographic Information"
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          highlightClass={getCardHighlightClass('geographic')}
          onEdit={() => openEditModal('geographic')}
        >
          <InfoRow label="Address Line 1" value={community.addressLine1} />
          <InfoRow label="Address Line 2" value={community.addressLine2} />
          <InfoRow label="City" value={community.city} />
          <InfoRow label="State" value={community.state} />
          <InfoRow label="Postal Code" value={community.postalCode} />
        </InfoCard>

        <InfoCard
          title="Legal & Finance"
          icon={<DocumentTextIcon className="w-6 h-6" />}
          highlightClass={getCardHighlightClass('legal')}
          onEdit={() => openEditModal('legal')}
        >
          <InfoRow label="Tax ID" value={community.taxId} />
          <InfoRow label="State Tax ID" value={community.stateTaxId} />
          <InfoRow label="SOS File Number" value={community.sosFileNumber} />
          <InfoRow label="Tax Return Type" value={community.taxReturnType} />
          <InfoRow label="Acquisition Type" value={community.acquisitionType} />
        </InfoCard>

        <InfoCard
          title="Contract Information"
          icon={<ClockIcon className="w-6 h-6" />}
          highlightClass={getCardHighlightClass('contracts')}
          onEdit={() => openEditModal('contract')}
        >
          <InfoRow label="Contract Start" value={formatDate(community.contractStart)} />
          <InfoRow label="Contract End" value={formatDate(community.contractEnd)} />
        </InfoCard>

        <InfoCard
          title="System Information"
          icon={<CogIcon className="w-6 h-6" />}
          highlightClass={getCardHighlightClass('system')}
          onEdit={() => openEditModal('system')}
        >
          <InfoRow label="Active" value={community.active ? 'Yes' : 'No'} />
          <InfoRow label="Third Party Identifier" value={community.thirdPartyIdentifier} />
          <InfoRow label="Record ID" value={community.id} />
          <InfoRow label="Created On" value={formatDate(community.createdOn)} />
          <InfoRow label="Created By" value={community.createdByName || community.createdBy || 'Not available'} />
          <InfoRow label="Last Modified On" value={formatDate(community.modifiedOn)} />
          <InfoRow label="Last Modified By" value={community.modifiedByName || community.modifiedBy || 'Not available'} />
        </InfoCard>

        <InfoCard title="Management Team" icon={<UserGroupIcon className="w-6 h-6" />}>
          <p className="text-sm text-secondary">
            Management team details will be reintroduced after the backend migration. For now this section is read-only.
          </p>
        </InfoCard>
      </section>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={modalTitle}
        fields={editingCard ? getFieldConfig(editingCard) : []}
        initialData={modalInitialData}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  );
};

export default CommunityInfo;
