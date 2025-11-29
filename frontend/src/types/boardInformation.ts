// Board Information types for the HOA Nexus application

export interface DatabaseBoardInformation {
  BoardInformationID: string;
  CommunityID: string;
  AnnualMeetingFrequency: string | null;
  RegularMeetingFrequency: string | null;
  BoardMembersRequired: number | null;
  Quorum: number | null;
  TermLimits: string | null;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  IsActive: boolean;
}

export interface BoardInformation {
  id: string;
  communityId: string;
  annualMeetingFrequency: string | null;
  regularMeetingFrequency: string | null;
  boardMembersRequired: number | null;
  quorum: number | null;
  termLimits: string | null;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  isActive: boolean;
}

export interface CreateBoardInformationData {
  CommunityID: string;
  AnnualMeetingFrequency?: string | null;
  RegularMeetingFrequency?: string | null;
  BoardMembersRequired?: number | null;
  Quorum?: number | null;
  TermLimits?: string | null;
}

export interface UpdateBoardInformationData {
  AnnualMeetingFrequency?: string | null;
  RegularMeetingFrequency?: string | null;
  BoardMembersRequired?: number | null;
  Quorum?: number | null;
  TermLimits?: string | null;
}

