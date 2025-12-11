// Database representation (matches SQL table)
export interface DatabaseFile {
  FileID: string;
  FolderID: string | null;
  CommunityID: string;
  FileName: string;
  FileNameStored: string;
  FilePath: string;
  FileSize: number;
  MimeType: string | null;
  FileType: string | null;
  IsActive: boolean;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  // Document indexing fields
  IsIndexed: boolean;
  LastIndexedDate: string | null;
  IndexingVersion: number | null;
  FileHash: string | null;
  IndexingError: string | null;
  ChunkCount: number | null;
  ForceReindex: boolean;
}

// Frontend representation
export interface File {
  id: string;
  folderId: string | null;
  communityId: string;
  fileName: string;
  fileNameStored: string;
  filePath: string;
  fileSize: number;
  mimeType: string | null;
  fileType: string | null;
  isActive: boolean;
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
  // Document indexing fields
  isIndexed: boolean;
  lastIndexedDate: string | null;
  indexingVersion: number | null;
  fileHash: string | null;
  indexingError: string | null;
  chunkCount: number | null;
  forceReindex: boolean;
}

// Upload payload
export interface UploadFileData {
  CommunityID?: string | null; // Optional for corporate files
  FolderID?: string | null;
  FileType?: string;
  FolderType?: 'Community' | 'Corporate'; // Optional - defaults based on CommunityID
  file: File; // The actual File object from input
}

// Update payload
export interface UpdateFileData {
  FileName?: string;
  FolderID?: string | null;
  FileType?: string;
}

// Helper to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper to get file icon/type
export const getFileIcon = (mimeType: string | null, fileType: string | null): string => {
  if (!mimeType) return 'document';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
  if (mimeType.includes('text')) return 'text';
  
  return 'document';
};

