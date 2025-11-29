// Management Fee types for the HOA Nexus application

export interface DatabaseManagementFee {
  ManagementFeesID: string;
  CommunityID: string;
  ManagementFee: number | null;
  PerUnitFee: number | null;
  FeeTypeID: string | null;
  FeeType: string | null; // Joined from dropdown
  IncreaseType: string | null;
  IncreaseEffective: string | null; // Date string
  BoardApprovalRequired: boolean;
  AutoIncrease: string | null;
  FixedCost: number | null;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  IsActive: boolean;
}

export interface ManagementFee {
  id: string;
  communityId: string;
  managementFee: number | null;
  perUnitFee: number | null;
  feeType: string | null;
  increaseType: string | null;
  increaseEffective: string | null;
  boardApprovalRequired: boolean;
  autoIncrease: string | null;
  fixedCost: number | null;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  isActive: boolean;
}

export interface CreateManagementFeeData {
  CommunityID: string;
  ManagementFee?: number | null;
  PerUnitFee?: number | null;
  FeeType?: string | null;
  IncreaseType?: string | null;
  IncreaseEffective?: string | null;
  BoardApprovalRequired?: boolean;
  AutoIncrease?: string | null;
  FixedCost?: number | null;
}

export interface UpdateManagementFeeData {
  ManagementFee?: number | null;
  PerUnitFee?: number | null;
  FeeType?: string | null;
  IncreaseType?: string | null;
  IncreaseEffective?: string | null;
  BoardApprovalRequired?: boolean;
  AutoIncrease?: string | null;
  FixedCost?: number | null;
}

