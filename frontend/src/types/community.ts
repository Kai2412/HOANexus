// Community-related types for the HOA Nexus application

export interface DatabaseCommunity {
  CommunityID: string;
  PropertyCode: string | null;
  DisplayName: string | null;
  LegalName: string | null;
  Active: boolean | null;
  ContractStart: string | null;
  ContractEnd: string | null;
  Address: string | null;
  Address2: string | null;
  City: string | null;
  State: string | null;
  Zipcode: string | null;
  ThirdPartyIdentifier: string | null;
  Market: string | null;
  Office: string | null;
  Website: string | null;
  TaxID: string | null;
  StateTaxID: string | null;
  SOSFileNumber: string | null;
  TaxReturnType: string | null;
  ClientType: string | null;
  ServiceType: string | null;
  ManagementType: string | null;
  BuiltOutUnits: number | null;
  DevelopmentStage: string | null;
  CommunityStatus: string | null;
  AcquisitionType: string | null;
  PreferredContactInfo: string | null;
  CreatedOn: string | null;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
}

export interface Community {
  id: string;
  propertyCode?: string | null;
  displayName?: string | null;
  legalName?: string | null;
  active?: boolean | null;
  communityStatus?: string | null;
  clientType?: string | null;
  serviceType?: string | null;
  managementType?: string | null;
  developmentStage?: string | null;
  builtOutUnits?: number | null;
  market?: string | null;
  office?: string | null;
  website?: string | null;
  thirdPartyIdentifier?: string | null;
  preferredContactInfo?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  contractStart?: string | null;
  contractEnd?: string | null;
  acquisitionType?: string | null;
  taxId?: string | null;
  stateTaxId?: string | null;
  sosFileNumber?: string | null;
  taxReturnType?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
  modifiedByName?: string | null;
  original: DatabaseCommunity;
  // derived/legacy compatibility
  name?: string | null;
  pcode?: string | null;
  status?: string | null;
  units?: number | null;
}

export interface UpdateCommunityData {
  PropertyCode?: string | null;
  DisplayName?: string | null;
  LegalName?: string | null;
  ClientType?: string | null;
  ServiceType?: string | null;
  ManagementType?: string | null;
  DevelopmentStage?: string | null;
  CommunityStatus?: string | null;
  BuiltOutUnits?: number | null;
  Market?: string | null;
  Office?: string | null;
  PreferredContactInfo?: string | null;
  Website?: string | null;
  Address?: string | null;
  Address2?: string | null;
  City?: string | null;
  State?: string | null;
  Zipcode?: string | null;
  ContractStart?: string | null;
  ContractEnd?: string | null;
  TaxID?: string | null;
  StateTaxID?: string | null;
  SOSFileNumber?: string | null;
  TaxReturnType?: string | null;
  AcquisitionType?: string | null;
  Active?: boolean | null;
  ThirdPartyIdentifier?: string | null;
}
