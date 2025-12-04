// Community Fee Variance types for the HOA Nexus application

export interface DatabaseCommunityFeeVariance {
  CommunityFeeVarianceID: string;
  CommunityID: string;
  FeeMasterID: string;
  VarianceType: 'Standard' | 'Not Billed' | 'Custom';
  CustomAmount: number | null;
  Notes: string | null;
  IsActive: boolean;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  // Joined from FeeMaster
  FeeName: string;
  DefaultAmount: number;
  FeeDisplayOrder: number;
}

export interface CommunityFeeVariance {
  id: string;
  communityId: string;
  feeMasterId: string;
  varianceType: 'Standard' | 'Not Billed' | 'Custom';
  customAmount: number | null;
  notes: string | null;
  isActive: boolean;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  // Joined from FeeMaster
  feeName: string;
  defaultAmount: number;
  feeDisplayOrder: number;
}

export interface CreateCommunityFeeVarianceData {
  CommunityID: string;
  FeeMasterID: string;
  VarianceType: 'Standard' | 'Not Billed' | 'Custom';
  CustomAmount?: number | null;
  Notes?: string | null;
}

export interface UpdateCommunityFeeVarianceData {
  VarianceType?: 'Standard' | 'Not Billed' | 'Custom';
  CustomAmount?: number | null;
  Notes?: string | null;
}

// Combined type for displaying fees with their variances
export interface FeeWithVariance {
  feeMasterId: string;
  feeName: string;
  defaultAmount: number;
  displayOrder: number;
  variance: CommunityFeeVariance | null;
  // Computed fields
  effectiveAmount: number | null; // null if "Not Billed", otherwise the amount to use
  isVariance: boolean;
}

