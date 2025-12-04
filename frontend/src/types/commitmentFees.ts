// Commitment Fees types for the HOA Nexus application

export interface DatabaseCommitmentFee {
  CommitmentFeeID: string;
  CommunityID: string;
  CommitmentTypeID: string;
  EntryType: 'Compensation' | 'Commitment';
  FeeName: string;
  Value: number | null;
  Notes: string | null;
  IsActive: boolean;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  // Joined from DynamicDropChoices
  CommitmentTypeName: string;
  CommitmentTypeDisplayOrder: number;
}

export interface CommitmentFee {
  id: string;
  communityId: string;
  commitmentTypeId: string;
  entryType: 'Compensation' | 'Commitment';
  feeName: string;
  value: number | null;
  notes: string | null;
  isActive: boolean;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  // Joined from DynamicDropChoices
  commitmentTypeName: string;
  commitmentTypeDisplayOrder: number;
}

export interface CreateCommitmentFeeData {
  CommunityID: string;
  CommitmentTypeID: string;
  EntryType?: 'Compensation' | 'Commitment';
  FeeName: string;
  Value?: number | null;
  Notes?: string | null;
}

export interface UpdateCommitmentFeeData {
  CommitmentTypeID?: string;
  EntryType?: 'Compensation' | 'Commitment';
  FeeName?: string;
  Value?: number | null;
  Notes?: string | null;
}

// Grouped type for displaying commitment fees by type
export interface CommitmentFeeGroup {
  commitmentTypeId: string;
  commitmentTypeName: string;
  displayOrder: number;
  fees: CommitmentFee[];
}

