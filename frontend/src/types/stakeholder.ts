// Stakeholder types based on cor_Stakeholders database schema

export interface Stakeholder {
  ID: number;
  Type: string;
  SubType: string | null;
  AccessLevel: string | null;
  CommunityID: number | null;
  FirstName: string | null;
  LastName: string | null;
  CompanyName: string | null;
  Email: string | null;
  Phone: string | null;
  MobilePhone: string | null;
  PreferredContactMethod: string | null;
  Status: string | null;
  PortalAccessEnabled: boolean | null;
  LastLoginDate: string | null; // ISO date string
  CreatedDate: string | null; // ISO date string
  Notes: string | null;
  IsActive: boolean | null;
}

export interface CreateStakeholderRequest {
  Type: string;
  SubType?: string;
  AccessLevel?: string;
  CommunityID?: number;
  FirstName: string;
  LastName: string;
  CompanyName?: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;
  PreferredContactMethod?: string;
  Status?: string;
  PortalAccessEnabled?: boolean;
  Notes?: string;
}

export interface UpdateStakeholderRequest {
  Type?: string;
  SubType?: string;
  AccessLevel?: string;
  CommunityID?: number;
  FirstName?: string;
  LastName?: string;
  CompanyName?: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;
  PreferredContactMethod?: string;
  Status?: string;
  PortalAccessEnabled?: boolean;
  Notes?: string;
}

export interface StakeholderSearchParams {
  q: string; // Search query
}

export interface StakeholderTypeParams {
  type: string; // Stakeholder type filter
}

// Valid stakeholder types based on the controller validation
export const STAKEHOLDER_TYPES = [
  'Resident',
  'Company Employee',
  'Vendor',
  'Other'
] as const;

export type StakeholderType = typeof STAKEHOLDER_TYPES[number];

// Valid contact methods
export const CONTACT_METHODS = [
  'Email',
  'Phone',
  'Mobile',
  'Text',
  'Mail'
] as const;

export type ContactMethod = typeof CONTACT_METHODS[number];

// Valid statuses
export const STAKEHOLDER_STATUSES = [
  'Active',
  'Inactive',
  'Pending',
  'Suspended'
] as const;

// SubTypes for each Stakeholder Type
export const STAKEHOLDER_SUBTYPES = {
  'Resident': [
    'Owner',
    'Family Member',
    'Guest'
  ],
  'Company Employee': [
    'Accounting',
    'Maintenance',
    'Amenity Access',
    'Customer Service',
    'Community Manager',
    'Director',
    'Executive (C-Suite)',
    'General Employee',
    'IT'
  ],
  'Vendor': [
    'Contractors',
    'Service Providers',
    'Suppliers'
  ],
  'Other': []
} as const;

// Access Levels (only for Employees)
export const ACCESS_LEVELS = [
  'Partial',
  'Full',
  'Admin'
] as const;

export type AccessLevel = typeof ACCESS_LEVELS[number];

export type StakeholderStatus = typeof STAKEHOLDER_STATUSES[number];

// API Response types
export interface StakeholderListResponse {
  success: boolean;
  message: string;
  data: Stakeholder[];
  count: number;
  type?: string;
  searchTerm?: string;
}

export interface StakeholderResponse {
  success: boolean;
  message: string;
  data: Stakeholder;
}

export interface StakeholderDeleteResponse {
  success: boolean;
  message: string;
}
