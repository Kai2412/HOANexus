// Fee Master types for the HOA Nexus application

export interface DatabaseFeeMaster {
  FeeMasterID: string;
  FeeName: string;
  DefaultAmount: number;
  DisplayOrder: number;
  IsActive: boolean;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
}

export interface FeeMaster {
  id: string;
  feeName: string;
  defaultAmount: number;
  displayOrder: number;
  isActive: boolean;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
}

export interface CreateFeeMasterData {
  FeeName: string;
  DefaultAmount: number;
  DisplayOrder?: number;
  IsActive?: boolean;
}

export interface UpdateFeeMasterData {
  FeeName?: string;
  DefaultAmount?: number;
  DisplayOrder?: number;
  IsActive?: boolean;
}

export interface FeeOrder {
  feeMasterId: string;
  displayOrder: number;
}

