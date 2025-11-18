export interface DynamicDropChoice {
  ChoiceID: string;
  GroupID: string;
  ChoiceValue: string;
  DisplayOrder: number;
  IsDefault: boolean;
  IsActive: boolean;
  IsSystemManaged?: boolean;
  CreatedOn?: string;
  CreatedBy?: string | null;
  ModifiedOn?: string | null;
  ModifiedBy?: string | null;
}

export type DynamicDropChoiceMap = Record<string, DynamicDropChoice[]>;

