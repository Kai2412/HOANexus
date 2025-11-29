import React, { useState, useEffect } from 'react';
import logger from '../../services/logger';
import { 
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import AdminDropDownTemplate from './AdminDropDownTemplate/AdminDropDownTemplate';
import BulkUpload from './BulkUpload';
import dataService from '../../services/dataService';

interface AdminProps {
  onClose?: () => void;
}

type DropdownCategory = 
  | 'access-levels'
  | 'acquisition-type'
  | 'billing-frequency'
  | 'client-type'
  | 'development-stage'
  | 'fee-type'
  | 'management-type'
  | 'notice-requirements'
  | 'preferred-contact-methods'
  | 'role-management'
  | 'service-type'
  | 'status'
  | 'stakeholder-types'
  | 'ticket-statuses';
type BulkUploadType = 'communities-upload' | 'stakeholders-upload';
type AdminCategory = 'dynamic-drop-choices' | 'bulk-uploads' | 'other';
type AdminView = 'categories' | AdminCategory | DropdownCategory | BulkUploadType;

interface DropdownChoice {
  ChoiceID: string;
  GroupID: string;
  ChoiceValue: string;
  DisplayOrder: number;
  IsDefault: boolean;
  IsActive: boolean;
  IsSystemManaged?: boolean;
}

const Admin: React.FC<AdminProps> = ({ onClose }) => {
  const [currentView, setCurrentView] = useState<AdminView>('categories');
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1, 2, 3]));
  const [expandedStakeholderTypes, setExpandedStakeholderTypes] = useState<Set<string>>(new Set());
  const [clientTypeChoices, setClientTypeChoices] = useState<DropdownChoice[]>([]);
  const [serviceTypeChoices, setServiceTypeChoices] = useState<DropdownChoice[]>([]);
  const [managementTypeChoices, setManagementTypeChoices] = useState<DropdownChoice[]>([]);
  const [developmentStageChoices, setDevelopmentStageChoices] = useState<DropdownChoice[]>([]);
  const [acquisitionTypeChoices, setAcquisitionTypeChoices] = useState<DropdownChoice[]>([]);
  const [feeTypeChoices, setFeeTypeChoices] = useState<DropdownChoice[]>([]);
  const [billingFrequencyChoices, setBillingFrequencyChoices] = useState<DropdownChoice[]>([]);
  const [noticeRequirementsChoices, setNoticeRequirementsChoices] = useState<DropdownChoice[]>([]);
  const [stakeholderTypeChoices, setStakeholderTypeChoices] = useState<DropdownChoice[]>([]);
  const [stakeholderSubTypes, setStakeholderSubTypes] = useState<Record<string, DropdownChoice[]>>({});
  const [accessLevelChoices, setAccessLevelChoices] = useState<DropdownChoice[]>([]);
  const [preferredContactMethodChoices, setPreferredContactMethodChoices] = useState<DropdownChoice[]>([]);
  const [statusChoices, setStatusChoices] = useState<DropdownChoice[]>([]);
  const [ticketStatusChoices, setTicketStatusChoices] = useState<DropdownChoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingChoice, setEditingChoice] = useState<DropdownChoice | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newChoiceValue, setNewChoiceValue] = useState('');
  const [addingSubTypeFor, setAddingSubTypeFor] = useState<string | null>(null);
  const [newSubTypeValue, setNewSubTypeValue] = useState('');

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const roleHierarchy = [
    {
      level: 0,
      name: 'Community User',
      description: 'Works directly for the community (Resident/Other with edit access - rare)',
      titles: [
        { id: 'guid-001', name: 'Community Employee', displayOrder: 1 }
      ]
    },
    {
      level: 1,
      name: 'Assistant',
      description: 'Company employee, entry-level (view-only, some confidential info)',
      titles: [
        { id: 'guid-002', name: 'Manager in Training', displayOrder: 1 },
        { id: 'guid-003', name: 'Maintenance Coordinator', displayOrder: 2 },
        { id: 'guid-004', name: 'Compliance Specialist', displayOrder: 3 },
        { id: 'guid-005', name: 'Accounting Specialist', displayOrder: 4 },
        { id: 'guid-006', name: 'General Assistant', displayOrder: 5 },
        { id: 'guid-007', name: 'Front Desk', displayOrder: 6 }
      ]
    },
    {
      level: 2,
      name: 'Manager',
      description: 'Company employee, manages assistants (can edit community info)',
      titles: [
        { id: 'guid-008', name: 'CAM', displayOrder: 1 },
        { id: 'guid-009', name: 'Onsite', displayOrder: 2 }
      ]
    },
    {
      level: 3,
      name: 'Director',
      description: 'Company employee, oversees managers (can edit community info, oversees managers)',
      titles: [
        { id: 'guid-010', name: 'Regional Director', displayOrder: 1 }
      ]
    }
  ];

  const mainCategories = [
    { 
      id: 'dynamic-drop-choices' as AdminCategory, 
      name: 'Dynamic Drop Choices', 
      icon: CogIcon,
      description: 'Manage all dropdown options and choices used throughout the system'
    },
    {
      id: 'bulk-uploads' as AdminCategory,
      name: 'Bulk Uploads',
      icon: ArrowUpTrayIcon,
      description: 'Import multiple communities or stakeholders using CSV files'
    }
    // Future: Add other admin sections here
    // { id: 'permissions' as AdminCategory, name: 'Permissions', icon: CogIcon, description: '...' }
  ];

  const dropdownCategories = [
    // Alphabetically organized for easy navigation and future additions
    { id: 'access-levels' as DropdownCategory, name: 'Access Levels', description: 'Configure access levels and permissions (None, View, View+Write, View+Write+Delete)' },
    { id: 'acquisition-type' as DropdownCategory, name: 'Acquisition Type', description: 'Manage acquisition type options (Organic, Acquisition)' },
    { id: 'billing-frequency' as DropdownCategory, name: 'Billing Frequency', description: 'Manage billing frequency options (Annual, Monthly, Semi-Annual, Quarterly)' },
    { id: 'client-type' as DropdownCategory, name: 'Client Type', description: 'Manage client type options (HOA, Condo, Commercial, etc.)' },
    { id: 'development-stage' as DropdownCategory, name: 'Development Stage', description: 'Manage development stage options (Homeowner Controlled, Declarant Controlled)' },
    { id: 'fee-type' as DropdownCategory, name: 'Fee Type', description: 'Manage fee type options (Flat Rate, Tiered, Per Unit)' },
    { id: 'management-type' as DropdownCategory, name: 'Management Type', description: 'Manage management type options (Portfolio, Onsite, Hybrid)' },
    { id: 'notice-requirements' as DropdownCategory, name: 'Notice Requirements', description: 'Manage notice requirement options (30 Days, 60 Days, 90 Days)' },
    { id: 'preferred-contact-methods' as DropdownCategory, name: 'Preferred Contact Methods', description: 'Manage preferred contact method options (Email, Phone, Mobile, Text, Mail)' },
    { id: 'role-management' as DropdownCategory, name: 'Role Management', description: 'Manage role hierarchy and titles for community assignments' },
    { id: 'service-type' as DropdownCategory, name: 'Service Type', description: 'Manage service type options (Full Service, Hybrid, Accounting Only, etc.)' },
    { id: 'status' as DropdownCategory, name: 'Status', description: 'Manage status options (Active, Inactive, Pending, Suspended)' },
    { id: 'stakeholder-types' as DropdownCategory, name: 'Stakeholder Types', description: 'Configure stakeholder types and subtypes' },
    { id: 'ticket-statuses' as DropdownCategory, name: 'Ticket Statuses', description: 'Manage ticket status options (Pending, InProgress, Hold, Completed, Rejected)' }
  ];

  // Get description for system-managed choices
  const getSystemManagedDescription = (choiceValue: string, groupId: string): string => {
    if (groupId === 'stakeholder-types') {
      const descriptions: Record<string, string> = {
        'Resident': 'Homeowners, tenants, and other community residents',
        'Staff': 'Employee of the management company',
        'Vendor': 'External contractors, service providers, and suppliers',
        'Other': 'Other stakeholder types not covered by the above categories'
      };
      return descriptions[choiceValue] || '';
    }
    if (groupId === 'access-levels') {
      const descriptions: Record<string, string> = {
        'None': 'No access to any sections',
        'View': 'Can view information but cannot make changes',
        'View+Write': 'Can view and edit information but cannot delete',
        'View+Write+Delete': 'Full access: can view, edit, and delete information'
      };
      return descriptions[choiceValue] || '';
    }
    return '';
  };

  const getBreadcrumbs = (): Array<{ label: string; onClick?: () => void; isActive?: boolean }> => {
    const base: Array<{ label: string; onClick?: () => void; isActive?: boolean }> = [
      { 
        label: 'Community Info', 
        onClick: () => {
          window.dispatchEvent(new CustomEvent('overlay:close'));
        }
      },
      { 
        label: 'Admin',
        onClick: () => setCurrentView('categories')
      }
    ];

    if (currentView === 'dynamic-drop-choices') {
      base.push({ 
        label: 'Dynamic Drop Choices',
        onClick: () => setCurrentView('dynamic-drop-choices'),
        isActive: true
      });
    } else if (currentView === 'bulk-uploads') {
      base.push({ 
        label: 'Bulk Uploads',
        onClick: () => setCurrentView('bulk-uploads'),
        isActive: true
      });
    } else if (currentView === 'communities-upload' || currentView === 'stakeholders-upload') {
      base.push({ 
        label: 'Bulk Uploads',
        onClick: () => setCurrentView('bulk-uploads')
      });
      if (currentView === 'communities-upload') {
        base.push({ label: 'Communities', isActive: true });
      } else if (currentView === 'stakeholders-upload') {
        base.push({ label: 'Stakeholders', isActive: true });
      }
    } else if (currentView !== 'categories' && (currentView as string) !== 'dynamic-drop-choices' && (currentView as string) !== 'bulk-uploads') {
      // We're in a dropdown category
      base.push({ 
        label: 'Dynamic Drop Choices',
        onClick: () => setCurrentView('dynamic-drop-choices')
      });
      const categoryNames: Record<DropdownCategory, string> = {
        'client-type': 'Client Type',
        'service-type': 'Service Type',
        'management-type': 'Management Type',
        'development-stage': 'Development Stage',
        'acquisition-type': 'Acquisition Type',
        'stakeholder-types': 'Stakeholder Types',
        'access-levels': 'Access Levels',
        'preferred-contact-methods': 'Preferred Contact Methods',
        'status': 'Status',
        'ticket-statuses': 'Ticket Statuses',
        'role-management': 'Role Management'
      };
      base.push({ label: categoryNames[currentView as DropdownCategory], isActive: true });
    } else {
      if (base.length > 0) {
        base[base.length - 1].isActive = true;
      }
    }

    return base;
  };


  // Load choices based on current view
  useEffect(() => {
    if (currentView === 'client-type') {
      loadClientTypeChoices();
    } else if (currentView === 'service-type') {
      loadServiceTypeChoices();
    } else if (currentView === 'management-type') {
      loadManagementTypeChoices();
    } else if (currentView === 'development-stage') {
      loadDevelopmentStageChoices();
    } else if (currentView === 'acquisition-type') {
      loadAcquisitionTypeChoices();
    } else if (currentView === 'fee-type') {
      loadFeeTypeChoices();
    } else if (currentView === 'billing-frequency') {
      loadBillingFrequencyChoices();
    } else if (currentView === 'notice-requirements') {
      loadNoticeRequirementsChoices();
    } else if (currentView === 'stakeholder-types') {
      loadStakeholderTypeChoices();
    } else if (currentView === 'access-levels') {
      loadAccessLevelChoices();
    } else if (currentView === 'preferred-contact-methods') {
      loadPreferredContactMethodChoices();
    } else if (currentView === 'status') {
      loadStatusChoices();
    } else if (currentView === 'ticket-statuses') {
      loadTicketStatusChoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const loadClientTypeChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['client-types'], true);
      const choices = data['client-types'] || [];
      choices.sort((a: DropdownChoice, b: DropdownChoice) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setClientTypeChoices(choices);
    } catch (error) {
      logger.error('Error loading client type choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadStakeholderTypeChoices = async () => {
    setLoading(true);
    try {
      // Load Types
      const typeData = await dataService.getDynamicDropChoices(['stakeholder-types'], true);
      const types = (typeData['stakeholder-types'] || []) as DropdownChoice[];
      types.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setStakeholderTypeChoices(types);

      // Load SubTypes for each Type (using group naming convention)
      const subTypeGroups = [
        'stakeholder-subtypes-resident',
        'stakeholder-subtypes-staff',
        'stakeholder-subtypes-vendor',
        'stakeholder-subtypes-other'
      ];
      const subTypesData = await dataService.getDynamicDropChoices(subTypeGroups, true);
      
      // Group SubTypes by Type (map group name to type)
      const grouped: Record<string, DropdownChoice[]> = {};
      types.forEach((type) => {
        const typeName = type.ChoiceValue.toLowerCase();
        const groupKey = `stakeholder-subtypes-${typeName}`;
        const subTypes = (subTypesData[groupKey] || []) as DropdownChoice[];
        subTypes.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
        grouped[type.ChoiceID] = subTypes;
      });
      
      setStakeholderSubTypes(grouped);
    } catch (error) {
      logger.error('Error loading stakeholder type choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceTypeChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['service-types'], true);
      const choices = (data['service-types'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setServiceTypeChoices(choices);
    } catch (error) {
      logger.error('Error loading service type choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadManagementTypeChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['management-types'], true);
      const choices = (data['management-types'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setManagementTypeChoices(choices);
    } catch (error) {
      logger.error('Error loading management type choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevelopmentStageChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['development-stages'], true);
      const choices = (data['development-stages'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setDevelopmentStageChoices(choices);
    } catch (error) {
      logger.error('Error loading development stage choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadAcquisitionTypeChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['acquisition-types'], true);
      const choices = (data['acquisition-types'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setAcquisitionTypeChoices(choices);
    } catch (error) {
      logger.error('Error loading acquisition type choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeTypeChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['fee-types'], true);
      const choices = (data['fee-types'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setFeeTypeChoices(choices);
    } catch (error) {
      logger.error('Error loading fee type choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadBillingFrequencyChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['billing-frequency'], true);
      const choices = (data['billing-frequency'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setBillingFrequencyChoices(choices);
    } catch (error) {
      logger.error('Error loading billing frequency choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoticeRequirementsChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['notice-requirements'], true);
      const choices = (data['notice-requirements'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setNoticeRequirementsChoices(choices);
    } catch (error) {
      logger.error('Error loading notice requirements choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccessLevelChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['access-levels'], true);
      const choices = (data['access-levels'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setAccessLevelChoices(choices);
    } catch (error) {
      logger.error('Error loading access level choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferredContactMethodChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['preferred-contact-methods'], true);
      const choices = (data['preferred-contact-methods'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setPreferredContactMethodChoices(choices);
    } catch (error) {
      logger.error('Error loading preferred contact method choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['status'], true);
      const choices = (data['status'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setStatusChoices(choices);
    } catch (error) {
      logger.error('Error loading status choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketStatusChoices = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDynamicDropChoices(['ticket-statuses'], true);
      const choices = (data['ticket-statuses'] || []) as DropdownChoice[];
      choices.sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0));
      setTicketStatusChoices(choices);
    } catch (error) {
      logger.error('Error loading ticket status choices', 'Admin', undefined, error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Generic handlers that work with current view
  const getCurrentChoices = (): DropdownChoice[] => {
    if (currentView === 'client-type') return clientTypeChoices;
    if (currentView === 'service-type') return serviceTypeChoices;
    if (currentView === 'management-type') return managementTypeChoices;
    if (currentView === 'development-stage') return developmentStageChoices;
    if (currentView === 'acquisition-type') return acquisitionTypeChoices;
    if (currentView === 'fee-type') return feeTypeChoices;
    if (currentView === 'billing-frequency') return billingFrequencyChoices;
    if (currentView === 'notice-requirements') return noticeRequirementsChoices;
    if (currentView === 'stakeholder-types') return stakeholderTypeChoices;
    if (currentView === 'access-levels') return accessLevelChoices;
    if (currentView === 'preferred-contact-methods') return preferredContactMethodChoices;
    if (currentView === 'status') return statusChoices;
    if (currentView === 'ticket-statuses') return ticketStatusChoices;
    return [];
  };

  const getCurrentGroupId = (): string => {
    const groupIdMap: Record<DropdownCategory, string> = {
      'client-type': 'client-types',
      'service-type': 'service-types',
      'management-type': 'management-types',
      'development-stage': 'development-stages',
      'acquisition-type': 'acquisition-types',
      'fee-type': 'fee-types',
      'billing-frequency': 'billing-frequency',
      'notice-requirements': 'notice-requirements',
      'stakeholder-types': 'stakeholder-types',
      'access-levels': 'access-levels',
      'preferred-contact-methods': 'preferred-contact-methods',
      'status': 'status',
      'ticket-statuses': 'ticket-statuses',
      'role-management': '' // Not a dropdown group
    };
    return groupIdMap[currentView as DropdownCategory] || '';
  };

  const reloadCurrentChoices = () => {
    if (currentView === 'client-type') loadClientTypeChoices();
    else if (currentView === 'service-type') loadServiceTypeChoices();
    else if (currentView === 'management-type') loadManagementTypeChoices();
    else if (currentView === 'development-stage') loadDevelopmentStageChoices();
    else if (currentView === 'acquisition-type') loadAcquisitionTypeChoices();
    else if (currentView === 'fee-type') loadFeeTypeChoices();
    else if (currentView === 'billing-frequency') loadBillingFrequencyChoices();
    else if (currentView === 'notice-requirements') loadNoticeRequirementsChoices();
    else if (currentView === 'stakeholder-types') loadStakeholderTypeChoices();
    else if (currentView === 'access-levels') loadAccessLevelChoices();
    else if (currentView === 'preferred-contact-methods') loadPreferredContactMethodChoices();
    else if (currentView === 'status') loadStatusChoices();
    else if (currentView === 'ticket-statuses') loadTicketStatusChoices();
  };

  const handleMoveUp = async (index: number) => {
    const choices = getCurrentChoices();
    if (index === 0) return;
    const newChoices = [...choices];
    [newChoices[index - 1], newChoices[index]] = [newChoices[index], newChoices[index - 1]];
    
    if (currentView === 'client-type') setClientTypeChoices(newChoices);
    else if (currentView === 'service-type') setServiceTypeChoices(newChoices);
    else if (currentView === 'management-type') setManagementTypeChoices(newChoices);
    else if (currentView === 'development-stage') setDevelopmentStageChoices(newChoices);
    else     if (currentView === 'acquisition-type') setAcquisitionTypeChoices(newChoices);
    else if (currentView === 'fee-type') setFeeTypeChoices(newChoices);
    else if (currentView === 'billing-frequency') setBillingFrequencyChoices(newChoices);
    else if (currentView === 'notice-requirements') setNoticeRequirementsChoices(newChoices);
    else if (currentView === 'stakeholder-types') setStakeholderTypeChoices(newChoices);
    else if (currentView === 'access-levels') setAccessLevelChoices(newChoices);
    else if (currentView === 'preferred-contact-methods') setPreferredContactMethodChoices(newChoices);
    else if (currentView === 'status') setStatusChoices(newChoices);
    else if (currentView === 'ticket-statuses') setTicketStatusChoices(newChoices);
    
    await saveOrder(newChoices);
  };

  const handleMoveDown = async (index: number) => {
    const choices = getCurrentChoices();
    if (index === choices.length - 1) return;
    const newChoices = [...choices];
    [newChoices[index], newChoices[index + 1]] = [newChoices[index + 1], newChoices[index]];
    
    if (currentView === 'client-type') setClientTypeChoices(newChoices);
    else if (currentView === 'service-type') setServiceTypeChoices(newChoices);
    else if (currentView === 'management-type') setManagementTypeChoices(newChoices);
    else if (currentView === 'development-stage') setDevelopmentStageChoices(newChoices);
    else if (currentView === 'acquisition-type') setAcquisitionTypeChoices(newChoices);
    else if (currentView === 'fee-type') setFeeTypeChoices(newChoices);
    else if (currentView === 'stakeholder-types') setStakeholderTypeChoices(newChoices);
    else if (currentView === 'access-levels') setAccessLevelChoices(newChoices);
    else if (currentView === 'preferred-contact-methods') setPreferredContactMethodChoices(newChoices);
    else if (currentView === 'status') setStatusChoices(newChoices);
    else if (currentView === 'ticket-statuses') setTicketStatusChoices(newChoices);
    
    await saveOrder(newChoices);
  };

  const handleSubTypeMoveUp = async (parentTypeId: string, subTypeIndex: number) => {
    const subTypes = stakeholderSubTypes[parentTypeId] || [];
    if (subTypeIndex === 0) return;
    
    const newSubTypes = [...subTypes];
    [newSubTypes[subTypeIndex - 1], newSubTypes[subTypeIndex]] = [newSubTypes[subTypeIndex], newSubTypes[subTypeIndex - 1]];
    
    // Get the parent type to determine group ID
    const parentType = stakeholderTypeChoices.find(t => t.ChoiceID === parentTypeId);
    if (!parentType) return;
    const typeName = parentType.ChoiceValue.toLowerCase();
    const groupId = `stakeholder-subtypes-${typeName}`;
    
    // Update state
    setStakeholderSubTypes(prev => ({
      ...prev,
      [parentTypeId]: newSubTypes
    }));
    
    // Save order
    try {
      await dataService.bulkUpdateChoiceOrder(
        groupId,
        newSubTypes.map((st) => ({ choiceId: st.ChoiceID }))
      );
    } catch (error) {
      logger.error('Error saving subtype order', 'Admin', undefined, error as Error);
      loadStakeholderTypeChoices(); // Reload on error
    }
  };

  const handleSubTypeMoveDown = async (parentTypeId: string, subTypeIndex: number) => {
    const subTypes = stakeholderSubTypes[parentTypeId] || [];
    if (subTypeIndex === subTypes.length - 1) return;
    
    const newSubTypes = [...subTypes];
    [newSubTypes[subTypeIndex], newSubTypes[subTypeIndex + 1]] = [newSubTypes[subTypeIndex + 1], newSubTypes[subTypeIndex]];
    
    // Get the parent type to determine group ID
    const parentType = stakeholderTypeChoices.find(t => t.ChoiceID === parentTypeId);
    if (!parentType) return;
    const typeName = parentType.ChoiceValue.toLowerCase();
    const groupId = `stakeholder-subtypes-${typeName}`;
    
    // Update state
    setStakeholderSubTypes(prev => ({
      ...prev,
      [parentTypeId]: newSubTypes
    }));
    
    // Save order
    try {
      await dataService.bulkUpdateChoiceOrder(
        groupId,
        newSubTypes.map((st) => ({ choiceId: st.ChoiceID }))
      );
    } catch (error) {
      logger.error('Error saving subtype order', 'Admin', undefined, error as Error);
      loadStakeholderTypeChoices(); // Reload on error
    }
  };

  const saveOrder = async (choices: DropdownChoice[]) => {
    const groupId = getCurrentGroupId();
    if (!groupId) return;
    try {
      await dataService.bulkUpdateChoiceOrder(
        groupId,
        choices.map(c => ({ choiceId: c.ChoiceID }))
      );
    } catch (error) {
      logger.error('Error saving order', 'Admin', undefined, error as Error);
      // Reload on error
      reloadCurrentChoices();
    }
  };

  const handleEdit = (choice: DropdownChoice) => {
    setEditingChoice(choice);
    setEditingValue(choice.ChoiceValue);
  };

  const handleSaveEdit = async () => {
    if (!editingChoice || !editingValue.trim()) return;
    
    try {
      await dataService.updateDynamicDropChoice(editingChoice.ChoiceID, {
        choiceValue: editingValue.trim()
      });
      setEditingChoice(null);
      setEditingValue('');
      reloadCurrentChoices();
    } catch (error) {
      logger.error('Error updating choice', 'Admin', undefined, error as Error);
    }
  };

  const handleCancelEdit = () => {
    setEditingChoice(null);
    setEditingValue('');
  };

  const handleToggleActive = async (choice: DropdownChoice) => {
    const newActiveStatus = !choice.IsActive;
    const action = newActiveStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} "${choice.ChoiceValue}"? This will ${newActiveStatus ? 'make it available' : 'archive it'} for archival purposes.`)) return;
    
    try {
      await dataService.toggleDynamicDropChoiceActive(choice.ChoiceID, newActiveStatus);
      reloadCurrentChoices();
    } catch (error) {
      logger.error('Error toggling active status', 'Admin', undefined, error as Error);
    }
  };

  const handleToggleDefault = async (choice: DropdownChoice) => {
    const newDefaultStatus = !choice.IsDefault;
    
    try {
      await dataService.updateDynamicDropChoice(choice.ChoiceID, {
        isDefault: newDefaultStatus
      });
      reloadCurrentChoices();
    } catch (error) {
      logger.error('Error setting default', 'Admin', undefined, error as Error);
    }
  };

  const handleAddNew = async () => {
    if (!newChoiceValue.trim()) return;
    const groupId = getCurrentGroupId();
    if (!groupId) return;
    
    try {
      await dataService.createDynamicDropChoice({
        groupId,
        choiceValue: newChoiceValue.trim()
      });
      setNewChoiceValue('');
      setAddingNew(false);
      reloadCurrentChoices();
    } catch (error) {
      logger.error('Error creating choice', 'Admin', undefined, error as Error);
    }
  };

  const handleAddSubType = async (parentTypeId: string) => {
    if (!newSubTypeValue.trim()) return;
    
    try {
      // Get the parent type to determine group ID
      const parentType = stakeholderTypeChoices.find(t => t.ChoiceID === parentTypeId);
      if (!parentType) return;

      // Map type name to subtype group ID
      const typeName = parentType.ChoiceValue.toLowerCase();
      const groupId = `stakeholder-subtypes-${typeName}`;

      // Get current max display order for subtypes of this type
      const subTypes = stakeholderSubTypes[parentTypeId] || [];
      const maxOrder = subTypes.length > 0 ? Math.max(...subTypes.map(st => st.DisplayOrder || 0)) : 0;

      await dataService.createDynamicDropChoice({
        groupId,
        choiceValue: newSubTypeValue.trim(),
        displayOrder: maxOrder + 1
      });
      
      setNewSubTypeValue('');
      setAddingSubTypeFor(null);
      loadStakeholderTypeChoices(); // Reload to get the new subtype
    } catch (error) {
      logger.error('Error creating subtype', 'Admin', undefined, error as Error);
    }
  };

  // Check if current view allows adding new items
  const canAddNew = (): boolean => {
    // Block creation for system-managed groups
    return currentView !== 'stakeholder-types' && currentView !== 'access-levels';
  };

  // Generic render function for dropdown management
  const renderDropdownManagement = (title: string, description: string) => {
    const choices = getCurrentChoices();
    const groupId = getCurrentGroupId();
    const groupName = groupId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const allowAddNew = canAddNew();
    
    return (
      <div className="space-y-4">
        {!allowAddNew && (
          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> New choices cannot be created for this group as it is system-managed and required for core functionality. These options are displayed for reference and explanation purposes.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary">Loading...</p>
          </div>
        ) : (
          <>
            <div className="bg-surface-secondary border border-primary rounded-lg overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-primary">
                <h3 className="text-lg font-semibold text-primary">{groupName}</h3>
                {!addingNew && allowAddNew && (
                  <button
                    onClick={() => setAddingNew(true)}
                    className="flex items-center space-x-1 px-3 py-1 bg-royal-600 hover:bg-royal-700 text-white rounded text-sm transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {addingNew && (
                <div className="p-4 border-b border-primary bg-surface">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newChoiceValue}
                      onChange={(e) => setNewChoiceValue(e.target.value)}
                      placeholder={`Enter ${groupName.toLowerCase()} name`}
                      className="flex-1 px-3 py-2 border border-primary rounded bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNew();
                        if (e.key === 'Escape') {
                          setAddingNew(false);
                          setNewChoiceValue('');
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleAddNew}
                      className="px-3 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setAddingNew(false);
                        setNewChoiceValue('');
                      }}
                      className="px-3 py-2 bg-surface-tertiary hover:bg-surface text-primary rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {choices.length === 0 ? (
                <div className="p-4 text-center text-secondary text-sm">
                  No choices configured. Click "Add New" to create one.
                </div>
              ) : (
                <div className="divide-y divide-primary">
                  {choices
                    .filter(c => c.IsActive) // Show active items first
                    .concat(choices.filter(c => !c.IsActive)) // Then inactive items
                    .map((choice, index) => {
                      // Calculate display index for reordering (only active items can be reordered)
                      const activeChoices = choices.filter(c => c.IsActive);
                      const activeIndex = activeChoices.indexOf(choice);
                      const displayIndex = activeIndex >= 0 ? activeIndex : activeChoices.length;
                      return (
                    <div key={choice.ChoiceID} className={`p-4 flex items-center justify-between transition-colors ${choice.IsActive ? 'hover:bg-surface-tertiary' : 'bg-gray-50 dark:bg-gray-900/20 opacity-75'}`}>
                      {editingChoice?.ChoiceID === choice.ChoiceID ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-primary rounded bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded text-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-2 bg-surface-tertiary hover:bg-surface text-primary rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-primary font-medium ${!choice.IsActive ? 'opacity-50 line-through' : ''}`}>
                                  {choice.ChoiceValue}
                                </span>
                                {choice.IsDefault && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
                                    Default
                                  </span>
                                )}
                                {choice.IsSystemManaged && (
                                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium">
                                    System Managed
                                  </span>
                                )}
                                {!choice.IsActive && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-tertiary font-mono">GUID: {choice.ChoiceID}</span>
                              {/* Description/Note area - can be expanded later with a Description field */}
                              {choice.IsSystemManaged && (
                                <div className="mt-1 text-xs text-secondary italic">
                                  {getSystemManagedDescription(choice.ChoiceValue, choice.GroupID)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleMoveUp(displayIndex)}
                              disabled={displayIndex === 0 || choice.IsSystemManaged || !choice.IsActive}
                              className="p-2 text-tertiary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={choice.IsSystemManaged ? "System-managed items cannot be reordered" : !choice.IsActive ? "Activate to reorder" : "Move up"}
                            >
                              <ArrowUpIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(displayIndex)}
                              disabled={displayIndex === choices.filter(c => c.IsActive).length - 1 || choice.IsSystemManaged || !choice.IsActive}
                              className="p-2 text-tertiary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={choice.IsSystemManaged ? "System-managed items cannot be reordered" : !choice.IsActive ? "Activate to reorder" : "Move down"}
                            >
                              <ArrowDownIcon className="w-4 h-4" />
                            </button>
                            {/* Default Toggle */}
                            <label className="flex items-center space-x-1 cursor-pointer" title={choice.IsSystemManaged ? "System-managed items cannot change default" : choice.IsDefault ? "This is the default option" : "Set as default"}>
                              <input
                                type="checkbox"
                                checked={choice.IsDefault || false}
                                onChange={() => handleToggleDefault(choice)}
                                disabled={choice.IsSystemManaged}
                                className="w-4 h-4 text-royal-600 rounded focus:ring-royal-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                              <span className="text-xs text-tertiary">Default</span>
                            </label>
                            
                            {/* Active/Inactive Toggle */}
                            <button
                              onClick={() => handleToggleActive(choice)}
                              disabled={choice.IsSystemManaged}
                              className={`p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                choice.IsActive
                                  ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                              title={choice.IsSystemManaged ? "System-managed items cannot be deactivated" : choice.IsActive ? "Deactivate (archive)" : "Activate"}
                            >
                              {choice.IsActive ? (
                                <CheckCircleIcon className="w-5 h-5" />
                              ) : (
                                <XCircleIcon className="w-5 h-5" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleEdit(choice)}
                              disabled={choice.IsSystemManaged || !choice.IsActive}
                              className="p-2 text-tertiary hover:text-royal-600 dark:hover:text-royal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={choice.IsSystemManaged ? "System-managed items cannot be edited" : !choice.IsActive ? "Activate to edit" : "Edit"}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const toggleStakeholderType = (typeId: string) => {
    setExpandedStakeholderTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  const renderStakeholderTypesManagement = () => {
    return (
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary">Loading...</p>
          </div>
        ) : (
          stakeholderTypeChoices.map((type) => {
            const subTypes = stakeholderSubTypes[type.ChoiceID] || [];
            return (
              <div key={type.ChoiceID} className="bg-surface-secondary border border-primary rounded-lg overflow-hidden">
                {/* Type Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-tertiary transition-colors"
                  onClick={() => toggleStakeholderType(type.ChoiceID)}
                >
                  <div className="flex items-center space-x-3">
                    {expandedStakeholderTypes.has(type.ChoiceID) ? (
                      <ChevronDownIcon className="w-5 h-5 text-tertiary" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-tertiary" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-primary">{type.ChoiceValue}</span>
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium">
                          System Managed
                        </span>
                        <span className="px-2 py-1 bg-royal-100 dark:bg-royal-900/30 text-royal-600 dark:text-royal-400 rounded text-xs font-medium">
                          {subTypes.length} {subTypes.length === 1 ? 'subtype' : 'subtypes'}
                        </span>
                      </div>
                      <p className="text-sm text-secondary mt-1">
                        {getSystemManagedDescription(type.ChoiceValue, 'Type')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SubTypes List */}
                {expandedStakeholderTypes.has(type.ChoiceID) && (
                  <div className="border-t border-primary bg-surface">
                    {/* SubTypes Section Header with Add Button */}
                    <div className="p-4 flex items-center justify-between border-b border-primary bg-surface-secondary">
                      <h3 className="text-lg font-semibold text-primary">SubTypes</h3>
                      {!addingSubTypeFor && (
                        <button
                          onClick={() => {
                            setAddingSubTypeFor(type.ChoiceID);
                            setNewSubTypeValue('');
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-royal-600 hover:bg-royal-700 text-white rounded text-sm transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Add SubType</span>
                        </button>
                      )}
                    </div>

                    {/* Add SubType Input */}
                    {addingSubTypeFor === type.ChoiceID && (
                      <div className="p-4 border-b border-primary bg-surface-tertiary">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newSubTypeValue}
                            onChange={(e) => setNewSubTypeValue(e.target.value)}
                            placeholder="Enter subtype name"
                            className="flex-1 px-3 py-2 border border-primary rounded bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddSubType(type.ChoiceID);
                              if (e.key === 'Escape') {
                                setAddingSubTypeFor(null);
                                setNewSubTypeValue('');
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddSubType(type.ChoiceID)}
                            className="px-3 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded text-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setAddingSubTypeFor(null);
                              setNewSubTypeValue('');
                            }}
                            className="px-3 py-2 bg-surface-tertiary hover:bg-surface text-primary rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {subTypes.length === 0 ? (
                      <div className="p-4 text-center text-secondary text-sm">
                        {addingSubTypeFor === type.ChoiceID 
                          ? 'Enter a subtype name above and click Save.'
                          : 'No subtypes configured. Click "Add SubType" to create one.'}
                      </div>
                    ) : (
                      <div className="divide-y divide-primary">
                        {subTypes.map((subType, index) => (
                          <div key={subType.ChoiceID} className="p-4 flex items-center justify-between hover:bg-surface-tertiary transition-colors">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-primary font-medium ${!subType.IsActive ? 'opacity-50 line-through' : ''}`}>
                                    {subType.ChoiceValue}
                                  </span>
                                  {subType.IsDefault && (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
                                      Default
                                    </span>
                                  )}
                                  {!subType.IsActive && (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-tertiary font-mono">GUID: {subType.ChoiceID}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSubTypeMoveUp(type.ChoiceID, index)}
                                disabled={index === 0 || !subType.IsActive}
                                className="p-2 text-tertiary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Move up"
                              >
                                <ArrowUpIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSubTypeMoveDown(type.ChoiceID, index)}
                                disabled={index === subTypes.length - 1 || !subType.IsActive}
                                className="p-2 text-tertiary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Move down"
                              >
                                <ArrowDownIcon className="w-4 h-4" />
                              </button>
                              {/* Default Toggle */}
                              <label className="flex items-center space-x-1 cursor-pointer" title={subType.IsDefault ? "This is the default option" : "Set as default"}>
                                <input
                                  type="checkbox"
                                  checked={subType.IsDefault || false}
                                  onChange={() => handleToggleDefault(subType)}
                                  className="w-4 h-4 text-royal-600 rounded focus:ring-royal-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                                <span className="text-xs text-tertiary">Default</span>
                              </label>
                              <button
                                onClick={() => handleToggleActive(subType)}
                                className={`p-2 transition-colors ${
                                  subType.IsActive
                                    ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                                title={subType.IsActive ? "Deactivate (archive)" : "Activate"}
                              >
                                {subType.IsActive ? (
                                  <CheckCircleIcon className="w-5 h-5" />
                                ) : (
                                  <XCircleIcon className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleEdit(subType)}
                                disabled={!subType.IsActive}
                                className="p-2 text-tertiary hover:text-royal-600 dark:hover:text-royal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={!subType.IsActive ? "Activate to edit" : "Edit"}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderRoleManagement = () => {
    return (
      <div className="space-y-4">
        {roleHierarchy.map((role) => (
          <div key={role.level} className="bg-surface-secondary border border-primary rounded-lg overflow-hidden">
            {/* Level Header */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-tertiary transition-colors"
              onClick={() => toggleLevel(role.level)}
            >
              <div className="flex items-center space-x-3">
                {expandedLevels.has(role.level) ? (
                  <ChevronDownIcon className="w-5 h-5 text-tertiary" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-tertiary" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-primary">
                      Level {role.level}: {role.name}
                    </span>
                    <span className="px-2 py-1 bg-royal-100 dark:bg-royal-900/30 text-royal-600 dark:text-royal-400 rounded text-xs font-medium">
                      {role.titles.length} {role.titles.length === 1 ? 'title' : 'titles'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary mt-1">{role.description}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Feature not yet implemented - Role Management titles functionality
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-royal-600 hover:bg-royal-700 text-white rounded text-sm transition-colors opacity-50 cursor-not-allowed"
                disabled
                title="Feature coming soon"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Title</span>
              </button>
            </div>

            {/* Titles List */}
            {expandedLevels.has(role.level) && (
              <div className="border-t border-primary bg-surface">
                {role.titles.length === 0 ? (
                  <div className="p-4 text-center text-secondary text-sm">
                    No titles configured. Click "Add Title" to create one.
                  </div>
                ) : (
                  <div className="divide-y divide-primary">
                    {role.titles.map((title, index) => (
                      <div key={title.id} className="p-4 flex items-center justify-between hover:bg-surface-tertiary transition-colors">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex flex-col space-y-1">
                            <span className="text-primary font-medium">{title.name}</span>
                            <span className="text-xs text-tertiary font-mono">GUID: {title.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {/* Feature not yet implemented */}}
                            disabled
                            className="p-2 text-tertiary opacity-30 cursor-not-allowed transition-colors"
                            title="Feature coming soon"
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* Feature not yet implemented */}}
                            disabled
                            className="p-2 text-tertiary opacity-30 cursor-not-allowed transition-colors"
                            title="Feature coming soon"
                          >
                            <ArrowDownIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* Feature not yet implemented */}}
                            disabled
                            className="p-2 text-tertiary opacity-30 cursor-not-allowed transition-colors"
                            title="Feature coming soon"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getTitle = () => {
    if (currentView === 'communities-upload') return 'Bulk Upload Communities';
    if (currentView === 'stakeholders-upload') return 'Bulk Upload Stakeholders';
    if (currentView === 'bulk-uploads') return 'Bulk Uploads';
    if (currentView === 'dynamic-drop-choices') return 'Dynamic Drop Choices';
    if (currentView === 'categories') return 'Admin Portal';
    
    // Check if it's a dropdown category
    const dropdownCategories: DropdownCategory[] = [
      'client-type', 'service-type', 'management-type', 'development-stage',
      'acquisition-type', 'stakeholder-types', 'access-levels',
      'preferred-contact-methods', 'status', 'ticket-statuses', 'role-management'
    ];
    
    if (dropdownCategories.includes(currentView as DropdownCategory)) {
      const categoryNames: Record<DropdownCategory, string> = {
        'client-type': 'Client Type Management',
        'service-type': 'Service Type Management',
        'management-type': 'Management Type Management',
        'development-stage': 'Development Stage Management',
        'acquisition-type': 'Acquisition Type Management',
        'fee-type': 'Fee Type Management',
        'billing-frequency': 'Billing Frequency Management',
        'notice-requirements': 'Notice Requirements Management',
        'stakeholder-types': 'Stakeholder Types Management',
        'access-levels': 'Access Levels Management',
        'preferred-contact-methods': 'Preferred Contact Methods Management',
        'status': 'Status Management',
        'ticket-statuses': 'Ticket Statuses Management',
        'role-management': 'Role Management'
      };
      return categoryNames[currentView as DropdownCategory] || 'Admin Portal';
    }
    
    return 'Admin Portal';
  };

  const getDescription = () => {
    if (currentView === 'communities-upload') return 'Upload multiple communities at once using a CSV file';
    if (currentView === 'stakeholders-upload') return 'Upload multiple stakeholders at once using a CSV file';
    if (currentView === 'bulk-uploads') return 'Import multiple records at once using CSV files';
    if (currentView === 'dynamic-drop-choices') return 'Manage dropdown options and choices used throughout the system';
    if (currentView === 'categories') return 'Manage system configurations and admin tools';
    
    // Check if it's a dropdown category
    const dropdownCategories: DropdownCategory[] = [
      'client-type', 'service-type', 'management-type', 'development-stage',
      'acquisition-type', 'fee-type', 'billing-frequency', 'notice-requirements', 'stakeholder-types', 'access-levels',
      'preferred-contact-methods', 'status', 'ticket-statuses', 'role-management'
    ];
    
    if (dropdownCategories.includes(currentView as DropdownCategory)) {
      const descriptions: Record<DropdownCategory, string> = {
        'client-type': 'Manage client type options for communities. The order you see here is the order they will appear in dropdowns.',
        'service-type': 'Manage service type options for communities (Full Service, Hybrid, Accounting Only, Compliance Only).',
        'management-type': 'Manage management type options for communities (Portfolio, Onsite, Hybrid).',
        'development-stage': 'Manage development stage options for communities (Homeowner Controlled, Declarant Controlled).',
        'acquisition-type': 'Manage acquisition type options for communities (Organic, Acquisition).',
        'fee-type': 'Manage fee type options for management fees (Flat Rate, Tiered, Per Unit).',
        'billing-frequency': 'Manage billing frequency options (Annual, Monthly, Semi-Annual, Quarterly).',
        'notice-requirements': 'Manage notice requirement options (30 Days, 60 Days, 90 Days).',
        'stakeholder-types': 'Configure stakeholder types and subtypes',
        'access-levels': 'Manage access levels (None, View, View+Write, View+Write+Delete). System-managed levels cannot be edited or deleted as they are required for permission control.',
        'preferred-contact-methods': 'Manage preferred contact method options (Email, Phone, Mobile, Text, Mail).',
        'status': 'Manage status options (Active, Inactive, Pending, Suspended).',
        'ticket-statuses': 'Manage ticket status options (Pending, InProgress, Hold, Completed, Rejected).',
        'role-management': 'Manage role hierarchy and titles for community assignments'
      };
      return descriptions[currentView as DropdownCategory] || 'Manage system configuration and dropdown options';
    }
    
    return 'Manage system configurations and admin tools';
  };

  return (
    <AdminDropDownTemplate
      title={getTitle()}
      description={getDescription()}
      onClose={onClose}
      breadcrumbs={getBreadcrumbs()}
    >
          {/* Main Categories View */}
          {currentView === 'categories' && (
            <div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mainCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setCurrentView(category.id)}
                      className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-left theme-transition"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-royal-100 dark:bg-royal-900/30 rounded-lg">
                          <Icon className="w-6 h-6 text-royal-600 dark:text-royal-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">{category.name}</h3>
                      </div>
                      <p className="text-sm text-secondary">{category.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Drop Choices - Subcategories */}
          {currentView === 'dynamic-drop-choices' && (
            <div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {dropdownCategories.map((category) => {
                  return (
                    <button
                      key={category.id}
                      onClick={() => setCurrentView(category.id)}
                      className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-left theme-transition"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-royal-100 dark:bg-royal-900/30 rounded-lg">
                          <CogIcon className="w-6 h-6 text-royal-600 dark:text-royal-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">{category.name}</h3>
                      </div>
                      <p className="text-sm text-secondary">{category.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bulk Uploads - Subcategories */}
          {currentView === 'bulk-uploads' && (
            <div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => setCurrentView('communities-upload')}
                  className="bg-surface-secondary rounded-lg border border-primary p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-left theme-transition"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-royal-100 dark:bg-royal-900/30 rounded-lg">
                      <BuildingOfficeIcon className="w-6 h-6 text-royal-600 dark:text-royal-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary">Communities</h3>
                  </div>
                  <p className="text-sm text-secondary">Import multiple communities using a CSV file</p>
                </button>
                {/* Future: Stakeholders upload */}
                <button
                  disabled
                  className="bg-surface-secondary rounded-lg border border-primary p-6 opacity-50 cursor-not-allowed text-left theme-transition"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-royal-100 dark:bg-royal-900/30 rounded-lg">
                      <ArrowUpTrayIcon className="w-6 h-6 text-royal-600 dark:text-royal-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary">Stakeholders (Coming Soon)</h3>
                  </div>
                  <p className="text-sm text-secondary">Import multiple stakeholders using a CSV file</p>
                </button>
              </div>
            </div>
          )}

          {/* Bulk Upload Type Views */}
          {currentView === 'communities-upload' && (
            <BulkUpload onBack={() => setCurrentView('bulk-uploads')} />
          )}

          {/* Dropdown Category Content Views */}
          {currentView !== 'categories' && currentView !== 'dynamic-drop-choices' && currentView !== 'bulk-uploads' && currentView !== 'communities-upload' && currentView !== 'stakeholders-upload' && (
            <div>
              {/* Community Dropdowns */}
              {currentView === 'client-type' && renderDropdownManagement(
                'Client Type Management',
                'Manage client type options for communities. The order you see here is the order they will appear in dropdowns.'
              )}
              {currentView === 'service-type' && renderDropdownManagement(
                'Service Type Management',
                'Manage service type options for communities (Full Service, Hybrid, Accounting Only, Compliance Only).'
              )}
              {currentView === 'management-type' && renderDropdownManagement(
                'Management Type Management',
                'Manage management type options for communities (Portfolio, Onsite, Hybrid).'
              )}
              {currentView === 'development-stage' && renderDropdownManagement(
                'Development Stage Management',
                'Manage development stage options for communities (Homeowner Controlled, Declarant Controlled).'
              )}
              {currentView === 'acquisition-type' && renderDropdownManagement(
                'Acquisition Type Management',
                'Manage acquisition type options for communities (Organic, Acquisition).'
              )}
              {currentView === 'fee-type' && renderDropdownManagement(
                'Fee Type Management',
                'Manage fee type options for management fees (Flat Rate, Tiered, Per Unit).'
              )}
              {currentView === 'billing-frequency' && renderDropdownManagement(
                'Billing Frequency Management',
                'Manage billing frequency options (Annual, Monthly, Semi-Annual, Quarterly).'
              )}
              {currentView === 'notice-requirements' && renderDropdownManagement(
                'Notice Requirements Management',
                'Manage notice requirement options (30 Days, 60 Days, 90 Days).'
              )}
              {/* Stakeholder Dropdowns */}
              {currentView === 'stakeholder-types' && renderStakeholderTypesManagement()}
              {currentView === 'access-levels' && renderDropdownManagement(
                'Access Levels Management',
                'Manage access levels (None, View, View+Write, View+Write+Delete). System-managed levels cannot be edited or deleted as they are required for permission control.'
              )}
              {currentView === 'preferred-contact-methods' && renderDropdownManagement(
                'Preferred Contact Methods Management',
                'Manage preferred contact method options (Email, Phone, Mobile, Text, Mail).'
              )}
              {currentView === 'status' && renderDropdownManagement(
                'Status Management',
                'Manage status options (Active, Inactive, Pending, Suspended).'
              )}
              {currentView === 'ticket-statuses' && renderDropdownManagement(
                'Ticket Statuses Management',
                'Manage ticket status options (Pending, InProgress, Hold, Completed, Rejected).'
              )}
              {/* Other */}
              {currentView === 'role-management' && renderRoleManagement()}
            </div>
          )}
    </AdminDropDownTemplate>
  );
};

export default Admin;

