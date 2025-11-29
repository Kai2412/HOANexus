// Billing Information types for the HOA Nexus application

export interface DatabaseBillingInformation {
  BillingInformationID: string;
  CommunityID: string;
  BillingFrequencyID: string | null;
  BillingFrequency: string | null; // Joined from dropdown
  BillingMonth: number | null;
  BillingDay: number | null;
  NoticeRequirementID: string | null;
  NoticeRequirement: string | null; // Joined from dropdown
  Coupon: boolean;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  IsActive: boolean;
}

export interface BillingInformation {
  id: string;
  communityId: string;
  billingFrequency: string | null;
  billingMonth: number | null;
  billingDay: number | null;
  noticeRequirement: string | null;
  coupon: boolean;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  isActive: boolean;
}

export interface CreateBillingInformationData {
  CommunityID: string;
  BillingFrequency?: string | null;
  BillingMonth?: number | null;
  BillingDay?: number | null;
  NoticeRequirement?: string | null;
  Coupon?: boolean;
}

export interface UpdateBillingInformationData {
  BillingFrequency?: string | null;
  BillingMonth?: number | null;
  BillingDay?: number | null;
  NoticeRequirement?: string | null;
  Coupon?: boolean;
}

