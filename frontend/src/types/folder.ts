// Database representation (matches SQL table)
export interface DatabaseFolder {
  FolderID: string;
  CommunityID: string | null; // NULL = global folder (all communities)
  ParentFolderID: string | null;
  FolderName: string;
  FolderPath: string | null;
  DisplayOrder: number;
  IsActive: boolean;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
}

// Frontend representation
export interface Folder {
  id: string;
  communityId: string | null; // NULL = global folder (all communities)
  parentFolderId: string | null;
  name: string;
  path: string | null;
  displayOrder: number;
  isActive: boolean;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  children?: Folder[]; // For tree structure
}

// Create/Update payloads
export interface CreateFolderData {
  CommunityID: string | null; // NULL = Corporate/Global folder
  ParentFolderID?: string | null;
  FolderName: string;
  FolderType?: 'Community' | 'Corporate' | 'Global'; // Optional - defaults based on CommunityID
  DisplayOrder?: number;
}

export interface UpdateFolderData {
  FolderName?: string;
  ParentFolderID?: string | null;
  DisplayOrder?: number;
}

