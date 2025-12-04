import React, { useEffect, useMemo, useState } from 'react';
import { BuildingOfficeIcon, DocumentTextIcon, ClockIcon, CogIcon, PencilIcon, UserGroupIcon, CurrencyDollarIcon, CreditCardIcon, UsersIcon } from '@heroicons/react/24/outline';
import type { Community, UpdateCommunityData, ManagementFee, CreateManagementFeeData, UpdateManagementFeeData, BillingInformation, CreateBillingInformationData, UpdateBillingInformationData, BoardInformation, CreateBoardInformationData, UpdateBoardInformationData } from '../../types';
import { getCommunityStatusColor, getCommunityStatusColorName, getCommunityTypeColor, getCommunityTypeColorName } from '../../utils/statusColors';
import { SearchResultsIndicator } from '../CommunitySearchBar';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EditModal from '../EditModal';
import type { FieldConfig } from '../EditModal';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
import InfoViewTemplate from '../InfoViewTemplate';

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

const CHOICE_COLUMNS_BY_CARD: Record<'basic' | 'geographic' | 'legal' | 'contract' | 'system' | 'managementFees' | 'billingInformation' | 'boardInformation', string[]> = {
  basic: ['ClientType', 'ServiceType', 'ManagementType', 'DevelopmentStage', 'CommunityStatus'],
  geographic: [],
  legal: ['AcquisitionType'],
  contract: [],
  system: [],
  managementFees: ['FeeType'],
  billingInformation: ['BillingFrequency', 'NoticeRequirement'],
  boardInformation: []
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

const getMonthName = (month: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || 'Invalid Month';
};

const getMonthOptions = (): { value: string; label: string }[] => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months.map((month, index) => ({
    value: String(index + 1),
    label: month
  }));
};

const getDayOptions = (): { value: string; label: string }[] => {
  return Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1)
  }));
};

const formatChipValue = (text: string | null | undefined) => text ?? 'Unknown';

const CommunityInfo: React.FC<CommunityInfoProps> = ({ community, onCommunityUpdate }) => {
  const statusValue = community.communityStatus ?? (community.active ? 'Active' : 'Inactive');
  const clientTypeValue = community.clientType ?? 'Unknown';
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<'basic' | 'geographic' | 'legal' | 'contract' | 'system' | 'managementFees' | 'billingInformation' | 'boardInformation' | null>(null);
  const [modalInitialData, setModalInitialData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [choiceOptions, setChoiceOptions] = useState<Record<string, ChoiceOption[]>>({});
  const [isChoiceLoading, setIsChoiceLoading] = useState(false);
  const [managementFee, setManagementFee] = useState<ManagementFee | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [billingInformation, setBillingInformation] = useState<BillingInformation | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [boardInformation, setBoardInformation] = useState<BoardInformation | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
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

    const managementFeeLabels: string[] = [];
    if (managementFee) {
      addField(managementFeeLabels, 'Management Fee', managementFee.managementFee ? `$${managementFee.managementFee.toFixed(2)}` : null);
      addField(managementFeeLabels, 'Per Unit Fee', managementFee.perUnitFee ? `$${managementFee.perUnitFee.toFixed(2)}` : null);
      addField(managementFeeLabels, 'Fee Type', managementFee.feeType);
      addField(managementFeeLabels, 'Increase Type', managementFee.increaseType);
      addField(managementFeeLabels, 'Increase Effective', formatDate(managementFee.increaseEffective));
      addField(managementFeeLabels, 'Board Approval Required', managementFee.boardApprovalRequired ? 'Yes' : 'No');
      addField(managementFeeLabels, 'Auto Increase', managementFee.autoIncrease);
      addField(managementFeeLabels, 'Fixed Cost', managementFee.fixedCost ? `$${managementFee.fixedCost.toFixed(2)}` : null);
    }

    const billingLabels: string[] = [];
    if (billingInformation) {
      addField(billingLabels, 'Billing Frequency', billingInformation.billingFrequency);
      addField(billingLabels, 'Billing Month', billingInformation.billingMonth ? getMonthName(billingInformation.billingMonth) : null);
      addField(billingLabels, 'Billing Day', billingInformation.billingDay?.toString());
      addField(billingLabels, 'Notice Requirement', billingInformation.noticeRequirement);
      addField(billingLabels, 'Coupon', billingInformation.coupon ? 'Yes' : 'No');
    }

    const boardLabels: string[] = [];
    if (boardInformation) {
      addField(boardLabels, 'Annual Meeting Frequency', boardInformation.annualMeetingFrequency);
      addField(boardLabels, 'Regular Meeting Frequency', boardInformation.regularMeetingFrequency);
      addField(boardLabels, 'Board Members Required', boardInformation.boardMembersRequired?.toString());
      addField(boardLabels, 'Quorum', boardInformation.quorum?.toString());
      addField(boardLabels, 'Term Limits', boardInformation.termLimits);
    }

    return [
      { id: 'basic', labels: basicLabels },
      { id: 'geographic', labels: geographicLabels },
      { id: 'legal', labels: legalLabels },
      { id: 'contracts', labels: contractLabels },
      { id: 'system', labels: systemLabels },
      { id: 'managementFees', labels: managementFeeLabels },
      { id: 'billingInformation', labels: billingLabels },
      { id: 'boardInformation', labels: boardLabels }
    ];
  }, [community, statusValue, clientTypeValue, managementFee, billingInformation, boardInformation]);

  const [searchTerm, setSearchTerm] = useState('');

  // Card titles mapping
  const cardTitles: Record<string, string> = {
    'basic': 'Basic Information',
    'geographic': 'Geographic Information',
    'legal': 'Legal & Finance',
    'contracts': 'Contract Information',
    'system': 'System Information',
    'managementFees': 'Management Fees',
    'billingInformation': 'Billing Information',
    'boardInformation': 'Board Information'
  };

  // Filter cards based on search term
  const shouldShowCard = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) {
      return () => true; // Show all cards when no search
    }

    // Create a map of card IDs to their searchable text
    const cardSearchText: Record<string, string> = {};
    searchableData.forEach((entry) => {
      const cardTitle = cardTitles[entry.id] || '';
      const allText = [cardTitle, ...entry.labels.map((l: string) => l.toString())]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      cardSearchText[entry.id] = allText;
    });

    return (cardId: string) => {
      const searchableText = cardSearchText[cardId] || '';
      return searchableText.includes(searchLower);
    };
  }, [searchTerm, searchableData]);

  const hasSearchResults = searchTerm.trim().length > 0;
  const visibleCardsCount = useMemo(() => {
    if (!hasSearchResults) return Object.keys(cardTitles).length;
    return Object.keys(cardTitles).filter(id => shouldShowCard(id)).length;
  }, [hasSearchResults, shouldShowCard]);

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
      'CommunityStatus': 'status',
      'FeeType': 'fee-types',
      'BillingFrequency': 'billing-frequency',
      'NoticeRequirement': 'notice-requirements'
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
          logger.error('Failed to load dynamic drop choices', 'CommunityInfo', undefined, error as Error);
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

  const getFieldConfig = (card: 'basic' | 'geographic' | 'legal' | 'contract' | 'system' | 'managementFees' | 'billingInformation' | 'boardInformation'): FieldConfig[] => {
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

    if (card === 'managementFees') {
      return [
        {
          key: 'ManagementFee',
          label: 'Management Fee',
          type: 'number',
          placeholder: 'Enter management fee amount'
        },
        {
          key: 'PerUnitFee',
          label: 'Per Unit Fee',
          type: 'number',
          placeholder: 'Enter per unit fee amount'
        },
        {
          key: 'FeeType',
          label: 'Fee Type',
          type: 'select',
          options: buildOptions('FeeType'),
          placeholder: getPlaceholderText('FeeType', 'Fee Type')
        },
        {
          key: 'IncreaseType',
          label: 'Increase Type',
          type: 'text',
          placeholder: 'Enter increase type (e.g., Annual, Biannual)'
        },
        {
          key: 'IncreaseEffective',
          label: 'Increase Effective Date',
          type: 'date'
        },
        {
          key: 'BoardApprovalRequired',
          label: 'Board Approval Required',
          type: 'boolean'
        },
        {
          key: 'AutoIncrease',
          label: 'Auto Increase',
          type: 'text',
          placeholder: 'Enter auto increase type'
        },
        {
          key: 'FixedCost',
          label: 'Fixed Cost',
          type: 'number',
          placeholder: 'Enter fixed cost amount'
        }
      ];
    }

    if (card === 'billingInformation') {
      return [
        {
          key: 'BillingFrequency',
          label: 'Billing Frequency',
          type: 'select',
          options: buildOptions('BillingFrequency'),
          placeholder: getPlaceholderText('BillingFrequency', 'Billing Frequency')
        },
        {
          key: 'BillingMonth',
          label: 'Billing Month',
          type: 'select',
          options: getMonthOptions(),
          placeholder: 'Select month'
        },
        {
          key: 'BillingDay',
          label: 'Billing Day',
          type: 'select',
          options: getDayOptions(),
          placeholder: 'Select day'
        },
        {
          key: 'NoticeRequirement',
          label: 'Notice Requirement',
          type: 'select',
          options: buildOptions('NoticeRequirement'),
          placeholder: getPlaceholderText('NoticeRequirement', 'Notice Requirement')
        },
        {
          key: 'Coupon',
          label: 'Coupon',
          type: 'boolean'
        }
      ];
    }

    if (card === 'boardInformation') {
      return [
        {
          key: 'AnnualMeetingFrequency',
          label: 'Annual Meeting Frequency',
          type: 'text',
          placeholder: 'Enter annual meeting frequency'
        },
        {
          key: 'RegularMeetingFrequency',
          label: 'Regular Meeting Frequency',
          type: 'text',
          placeholder: 'Enter regular meeting frequency'
        },
        {
          key: 'BoardMembersRequired',
          label: 'Board Members Required',
          type: 'number',
          placeholder: 'Enter number of board members required'
        },
        {
          key: 'Quorum',
          label: 'Quorum',
          type: 'number',
          placeholder: 'Enter quorum requirement'
        },
        {
          key: 'TermLimits',
          label: 'Term Limits',
          type: 'text',
          placeholder: 'Enter term limits'
        }
      ];
    }

    return [];
  };

  const getInitialData = (card: 'basic' | 'geographic' | 'legal' | 'contract' | 'system' | 'managementFees' | 'billingInformation' | 'boardInformation'): Record<string, any> => {
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

    if (card === 'managementFees') {
      if (!managementFee) {
        return {
          ManagementFee: '',
          PerUnitFee: '',
          FeeType: '',
          IncreaseType: '',
          IncreaseEffective: '',
          BoardApprovalRequired: false,
          AutoIncrease: '',
          FixedCost: ''
        };
      }
      return {
        ManagementFee: managementFee.managementFee ?? '',
        PerUnitFee: managementFee.perUnitFee ?? '',
        FeeType: managementFee.feeType ?? '',
        IncreaseType: managementFee.increaseType ?? '',
        IncreaseEffective: managementFee.increaseEffective ?? '',
        BoardApprovalRequired: managementFee.boardApprovalRequired ?? false,
        AutoIncrease: managementFee.autoIncrease ?? '',
        FixedCost: managementFee.fixedCost ?? ''
      };
    }

    if (card === 'billingInformation') {
      if (!billingInformation) {
        return {
          BillingFrequency: '',
          BillingMonth: '',
          BillingDay: '',
          NoticeRequirement: '',
          Coupon: false
        };
      }
      return {
        BillingFrequency: billingInformation.billingFrequency ?? '',
        BillingMonth: billingInformation.billingMonth ? String(billingInformation.billingMonth) : '',
        BillingDay: billingInformation.billingDay ? String(billingInformation.billingDay) : '',
        NoticeRequirement: billingInformation.noticeRequirement ?? '',
        Coupon: billingInformation.coupon ?? false
      };
    }

    if (card === 'boardInformation') {
      if (!boardInformation) {
        return {
          AnnualMeetingFrequency: '',
          RegularMeetingFrequency: '',
          BoardMembersRequired: '',
          Quorum: '',
          TermLimits: ''
        };
      }
      return {
        AnnualMeetingFrequency: boardInformation.annualMeetingFrequency ?? '',
        RegularMeetingFrequency: boardInformation.regularMeetingFrequency ?? '',
        BoardMembersRequired: boardInformation.boardMembersRequired ?? '',
        Quorum: boardInformation.quorum ?? '',
        TermLimits: boardInformation.termLimits ?? ''
      };
    }

    return {};
  };

  // Load management fee when community changes
  useEffect(() => {
    const loadManagementFee = async () => {
      setIsLoadingFee(true);
      try {
        const fee = await dataService.getManagementFeeByCommunity(community.id);
        setManagementFee(fee);
      } catch (error) {
        logger.error('Failed to load management fee', 'CommunityInfo', undefined, error as Error);
        setManagementFee(null);
      } finally {
        setIsLoadingFee(false);
      }
    };

    if (community.id) {
      loadManagementFee();
    }
  }, [community.id]);

  // Load billing information when community changes
  useEffect(() => {
    const loadBillingInformation = async () => {
      setIsLoadingBilling(true);
      try {
        logger.debug('Loading billing information for community', 'CommunityInfo', { communityId: community.id });
        const billing = await dataService.getBillingInformationByCommunity(community.id);
        logger.debug('Billing information loaded', 'CommunityInfo', { billing, communityId: community.id });
        setBillingInformation(billing);
      } catch (error) {
        logger.error('Error loading billing information', 'CommunityInfo', { communityId: community.id }, error as Error);
        setBillingInformation(null);
      } finally {
        setIsLoadingBilling(false);
      }
    };

    const loadBoardInformation = async () => {
      setIsLoadingBoard(true);
      try {
        logger.debug('Loading board information for community', 'CommunityInfo', { communityId: community.id });
        const board = await dataService.getBoardInformationByCommunity(community.id);
        logger.debug('Board information loaded', 'CommunityInfo', { board, communityId: community.id });
        setBoardInformation(board);
      } catch (error) {
        logger.error('Error loading board information', 'CommunityInfo', { communityId: community.id }, error as Error);
        setBoardInformation(null);
      } finally {
        setIsLoadingBoard(false);
      }
    };

    if (community.id) {
      loadBillingInformation();
      loadBoardInformation();
    }
  }, [community.id]);

  const openEditModal = (card: 'basic' | 'geographic' | 'legal' | 'contract' | 'system' | 'managementFees' | 'billingInformation' | 'boardInformation') => {
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
      } else if (editingCard === 'managementFees') {
        if (managementFee) {
          // Update existing
          const payload: UpdateManagementFeeData = {
            ManagementFee: toNumberOrNull(formValues.ManagementFee),
            PerUnitFee: toNumberOrNull(formValues.PerUnitFee),
            FeeType: normalizeString(formValues.FeeType),
            IncreaseType: normalizeString(formValues.IncreaseType),
            IncreaseEffective: formValues.IncreaseEffective || null,
            BoardApprovalRequired: Boolean(formValues.BoardApprovalRequired),
            AutoIncrease: normalizeString(formValues.AutoIncrease),
            FixedCost: toNumberOrNull(formValues.FixedCost)
          };

          const updatedFee = await dataService.updateManagementFee(managementFee.id, payload);
          setManagementFee(updatedFee);
        } else {
          // Create new
          const payload: CreateManagementFeeData = {
            CommunityID: community.id,
            ManagementFee: toNumberOrNull(formValues.ManagementFee),
            PerUnitFee: toNumberOrNull(formValues.PerUnitFee),
            FeeType: normalizeString(formValues.FeeType),
            IncreaseType: normalizeString(formValues.IncreaseType),
            IncreaseEffective: formValues.IncreaseEffective || null,
            BoardApprovalRequired: Boolean(formValues.BoardApprovalRequired),
            AutoIncrease: normalizeString(formValues.AutoIncrease),
            FixedCost: toNumberOrNull(formValues.FixedCost)
          };

          const newFee = await dataService.createManagementFee(payload);
          setManagementFee(newFee);
        }
      } else if (editingCard === 'billingInformation') {
        if (billingInformation) {
          // Update existing
          const payload: UpdateBillingInformationData = {
            BillingFrequency: normalizeString(formValues.BillingFrequency),
            BillingMonth: toNumberOrNull(formValues.BillingMonth),
            BillingDay: toNumberOrNull(formValues.BillingDay),
            NoticeRequirement: normalizeString(formValues.NoticeRequirement),
            Coupon: Boolean(formValues.Coupon)
          };

          const updatedBilling = await dataService.updateBillingInformation(billingInformation.id, payload);
          setBillingInformation(updatedBilling);
        } else {
          // Create new
          const payload: CreateBillingInformationData = {
            CommunityID: community.id,
            BillingFrequency: normalizeString(formValues.BillingFrequency),
            BillingMonth: toNumberOrNull(formValues.BillingMonth),
            BillingDay: toNumberOrNull(formValues.BillingDay),
            NoticeRequirement: normalizeString(formValues.NoticeRequirement),
            Coupon: Boolean(formValues.Coupon)
          };

          const newBilling = await dataService.createBillingInformation(payload);
          setBillingInformation(newBilling);
        }
      } else if (editingCard === 'boardInformation') {
        if (boardInformation) {
          // Update existing
          const payload: UpdateBoardInformationData = {
            AnnualMeetingFrequency: normalizeString(formValues.AnnualMeetingFrequency),
            RegularMeetingFrequency: normalizeString(formValues.RegularMeetingFrequency),
            BoardMembersRequired: toNumberOrNull(formValues.BoardMembersRequired),
            Quorum: toNumberOrNull(formValues.Quorum),
            TermLimits: normalizeString(formValues.TermLimits)
          };

          const updatedBoard = await dataService.updateBoardInformation(boardInformation.id, payload);
          setBoardInformation(updatedBoard);
        } else {
          // Create new
          const payload: CreateBoardInformationData = {
            CommunityID: community.id,
            AnnualMeetingFrequency: normalizeString(formValues.AnnualMeetingFrequency),
            RegularMeetingFrequency: normalizeString(formValues.RegularMeetingFrequency),
            BoardMembersRequired: toNumberOrNull(formValues.BoardMembersRequired),
            Quorum: toNumberOrNull(formValues.Quorum),
            TermLimits: normalizeString(formValues.TermLimits)
          };

          const newBoard = await dataService.createBoardInformation(payload);
          setBoardInformation(newBoard);
        }
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
            : editingCard === 'managementFees'
              ? 'Management Fees'
              : editingCard === 'billingInformation'
                ? 'Billing Information'
                : '';

  // Build header content
  const headerContent = (
    <>
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
              placeholder="Search by code, name, address, status..."
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
        </div>
      </div>
      {hasSearchResults && (
        <SearchResultsIndicator 
          searchTerm={searchTerm} 
          resultCount={visibleCardsCount} 
          onClear={() => setSearchTerm('')} 
        />
      )}
    </>
  );

  return (
    <InfoViewTemplate
      header={headerContent}
      hasSearchResults={!!searchTerm}
      maxHeightOffset={300}
    >
      <div className="cards-grid">
        {shouldShowCard('basic') && (
        <InfoCard
          title="Basic Information"
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
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
        )}

        {shouldShowCard('geographic') && (
        <InfoCard
          title="Geographic Information"
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          onEdit={() => openEditModal('geographic')}
        >
          <InfoRow label="Address Line 1" value={community.addressLine1} />
          <InfoRow label="Address Line 2" value={community.addressLine2} />
          <InfoRow label="City" value={community.city} />
          <InfoRow label="State" value={community.state} />
          <InfoRow label="Postal Code" value={community.postalCode} />
        </InfoCard>
        )}

        {shouldShowCard('legal') && (
        <InfoCard
          title="Legal & Finance"
          icon={<DocumentTextIcon className="w-6 h-6" />}
          onEdit={() => openEditModal('legal')}
        >
          <InfoRow label="Tax ID" value={community.taxId} />
          <InfoRow label="State Tax ID" value={community.stateTaxId} />
          <InfoRow label="SOS File Number" value={community.sosFileNumber} />
          <InfoRow label="Tax Return Type" value={community.taxReturnType} />
          <InfoRow label="Acquisition Type" value={community.acquisitionType} />
        </InfoCard>
        )}

        {shouldShowCard('contracts') && (
        <InfoCard
          title="Contract Information"
          icon={<ClockIcon className="w-6 h-6" />}
          onEdit={() => openEditModal('contract')}
        >
          <InfoRow label="Contract Start" value={formatDate(community.contractStart)} />
          <InfoRow label="Contract End" value={formatDate(community.contractEnd)} />
        </InfoCard>
        )}

        {shouldShowCard('system') && (
        <InfoCard
          title="System Information"
          icon={<CogIcon className="w-6 h-6" />}
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
        )}

        <InfoCard title="Management Team" icon={<UserGroupIcon className="w-6 h-6" />}>
          <p className="text-sm text-secondary">
            Management team details will be reintroduced after the backend migration. For now this section is read-only.
          </p>
        </InfoCard>

        {shouldShowCard('managementFees') && (
        <InfoCard
          title="Management Fees"
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          onEdit={() => openEditModal('managementFees')}
        >
          {isLoadingFee ? (
            <p className="text-sm text-secondary">Loading management fee information...</p>
          ) : managementFee ? (
            <>
              <InfoRow label="Management Fee" value={managementFee.managementFee !== null && managementFee.managementFee !== undefined ? `$${managementFee.managementFee.toFixed(2)}` : 'N/A'} />
              <InfoRow label="Per Unit Fee" value={managementFee.perUnitFee !== null && managementFee.perUnitFee !== undefined ? `$${managementFee.perUnitFee.toFixed(2)}` : 'N/A'} />
              <InfoRow label="Fee Type" value={managementFee.feeType || 'N/A'} chip chipColor="blue" />
              <InfoRow label="Increase Type" value={managementFee.increaseType || 'N/A'} />
              <InfoRow label="Increase Effective" value={managementFee.increaseEffective ? formatDate(managementFee.increaseEffective) : 'N/A'} />
              <InfoRow label="Board Approval Required" value={managementFee.boardApprovalRequired ? 'Yes' : 'No'} />
              <InfoRow label="Auto Increase" value={managementFee.autoIncrease || 'N/A'} />
              <InfoRow label="Fixed Cost" value={managementFee.fixedCost !== null && managementFee.fixedCost !== undefined ? `$${managementFee.fixedCost.toFixed(2)}` : 'N/A'} />
            </>
          ) : (
            <p className="text-sm text-secondary">No management fee information available.</p>
          )}
        </InfoCard>
        )}

        {shouldShowCard('billingInformation') && (
        <InfoCard
          title="Billing Information"
          icon={<CreditCardIcon className="w-6 h-6" />}
          onEdit={() => openEditModal('billingInformation')}
        >
          {isLoadingBilling ? (
            <p className="text-sm text-secondary">Loading billing information...</p>
          ) : (
            <>
              <InfoRow label="Billing Frequency" value={billingInformation?.billingFrequency || 'N/A'} chip chipColor="blue" />
              <InfoRow label="Billing Month" value={billingInformation?.billingMonth ? getMonthName(billingInformation.billingMonth) : 'N/A'} />
              <InfoRow label="Billing Day" value={billingInformation?.billingDay || 'N/A'} />
              <InfoRow label="Notice Requirement" value={billingInformation?.noticeRequirement || 'N/A'} chip chipColor="green" />
              <InfoRow label="Coupon" value={billingInformation?.coupon ? 'Yes' : 'No'} />
            </>
          )}
        </InfoCard>
        )}

        {shouldShowCard('boardInformation') && (
        <InfoCard
          title="Board Information"
          icon={<UsersIcon className="w-6 h-6" />}
          onEdit={() => openEditModal('boardInformation')}
        >
          {isLoadingBoard ? (
            <p className="text-sm text-secondary">Loading board information...</p>
          ) : (
            <>
              <InfoRow label="Annual Meeting Frequency" value={boardInformation?.annualMeetingFrequency || 'N/A'} />
              <InfoRow label="Regular Meeting Frequency" value={boardInformation?.regularMeetingFrequency || 'N/A'} />
              <InfoRow label="Board Members Required" value={boardInformation?.boardMembersRequired || 'N/A'} />
              <InfoRow label="Quorum" value={boardInformation?.quorum || 'N/A'} />
              <InfoRow label="Term Limits" value={boardInformation?.termLimits || 'N/A'} />
            </>
          )}
        </InfoCard>
        )}
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={modalTitle}
        fields={editingCard ? getFieldConfig(editingCard) : []}
        initialData={modalInitialData}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </InfoViewTemplate>
  );
};

export default CommunityInfo;
