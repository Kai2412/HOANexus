// Community-related types for the HOA Nexus application

export interface DatabaseCommunity {
  ID: number;
  Pcode: string;
  Name: string;
  DisplayName: string;
  CommunityType: string;
  Status: string;
  PropertyCount: number;
  FormationDate: string;
  FiscalYearStart: string;
  FiscalYearEnd: string;
  ContractStartDate: string;
  ContractEndDate: string;
  TaxID: string;
  TimeZone: string;
  MasterAssociation?: string;
  IsSubAssociation: boolean;
  LastAuditDate?: string;
  NextAuditDate?: string;
  DataCompleteness: number;
  IsActive: boolean;
  State?: string;
  City?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  PostalCode?: string;
  Country?: string;
  CreatedDate?: string;
  LastUpdated?: string;
}

export interface Community {
  id: number;
  pcode: string;
  name: string;
  displayName: string;
  legalName: string; // This will be the Name field from database
  communityType: string;
  status: string;
  units: number;
  formationDate: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  contractStartDate: string;
  contractEndDate: string;
  taxId: string;
  timeZone: string;
  state?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  country?: string;
  masterAssociation?: string;
  lastUpdated?: string;
  createdDate?: string;
  isSubAssociation: boolean;
  lastAuditDate?: string;
  nextAuditDate?: string;
  dataCompleteness: number;
  isActive: boolean;
  original: DatabaseCommunity;
}

export interface CreateCommunityData {
  pcode: string;
  name: string;
  displayName: string;
  communityType: string;
  status?: string;
  formationDate?: string;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  taxId?: string;
  timeZone?: string;
  masterAssociation?: string;
  isSubAssociation?: boolean;
}

export interface UpdateCommunityData extends Partial<CreateCommunityData> {
  id: number;
}
