import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
import InfoViewTemplate from '../InfoViewTemplate/InfoViewTemplate';
import Modal from '../Modal/Modal';
import type { Folder, File } from '../../types';
import { 
  FolderIcon, 
  DocumentIcon, 
  PhotoIcon,
  ArrowLeftIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { formatFileSize, getFileIcon } from '../../types/file';

interface FileBrowserProps {
  community: any; // Community type from context
}

const FileBrowser: React.FC<FileBrowserProps> = ({ community }) => {
  const { selectedCommunity } = useCommunity();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [corporateFolders, setCorporateFolders] = useState<Folder[]>([]); // Corporate folders linked to community
  const [files, setFiles] = useState<File[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCorporateView, setIsCorporateView] = useState(false); // Track if viewing Corporate virtual folder
  const [folderPath, setFolderPath] = useState<Folder[]>([]); // Breadcrumb path
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const communityId = selectedCommunity?.id || community?.id;

  // Load folders on mount or when community changes
  useEffect(() => {
    if (!communityId) return;

    const loadFolders = async () => {
      try {
        // Load community folders
        const foldersData = await dataService.getFoldersByCommunity(communityId);
        setFolders(foldersData);
        
        // Load Corporate folders that have files linked to this community
        const corporateFoldersData = await dataService.getCorporateFoldersForCommunity(communityId);
        setCorporateFolders(corporateFoldersData);
      } catch (error) {
        logger.error('Error loading folders', 'FileBrowser', { communityId }, error as Error);
      }
    };

    loadFolders();
  }, [communityId]);

  // Reload Corporate folders when entering Corporate view
  useEffect(() => {
    if (!communityId || !isCorporateView) return;

    const loadCorporateFolders = async () => {
      try {
        const corporateFoldersData = await dataService.getCorporateFoldersForCommunity(communityId);
        setCorporateFolders(corporateFoldersData);
      } catch (error) {
        logger.error('Error loading Corporate folders', 'FileBrowser', { communityId }, error as Error);
      }
    };

    loadCorporateFolders();
  }, [communityId, isCorporateView]);

  // Load files when folder changes or on initial load
  useEffect(() => {
    if (!communityId) return;

    const loadFiles = async () => {
      setIsLoadingFiles(true);
      try {
        let filesData: File[];
        
        if (isCorporateView) {
          // Loading Corporate files linked to this community
          filesData = await dataService.getCorporateFilesByFolderForCommunity(currentFolderId, communityId);
        } else {
          // Loading regular community files
          filesData = await dataService.getFilesByFolder(currentFolderId, communityId);
        }
        
        setFiles(filesData);
        // Clear search when folder changes
        setSearchTerm('');
      } catch (error) {
        logger.error('Error loading files', 'FileBrowser', { folderId: currentFolderId, isCorporateView }, error as Error);
      } finally {
        setIsLoadingFiles(false);
        setIsLoading(false); // Also clear initial loading state
      }
    };

    loadFiles();
  }, [currentFolderId, communityId, isCorporateView]);

  // Get subfolders for current folder
  const getSubfolders = (): Folder[] => {
    if (isCorporateView) {
      // In Corporate view - show Corporate folders
      if (!currentFolderId) {
        // Root Corporate level - show Corporate folders with no parent
        const rootFolders = corporateFolders.filter(f => !f.parentFolderId);
        logger.info('Corporate root folders', 'FileBrowser', {
          totalCorporateFolders: corporateFolders.length,
          rootFolders: rootFolders.length,
          rootFolderNames: rootFolders.map(f => f.name),
          allCorporateFolderNames: corporateFolders.map(f => ({ name: f.name, parentId: f.parentFolderId }))
        });
        return rootFolders;
      }
      // Show Corporate folders that have current folder as parent
      const subfolders = corporateFolders.filter(f => f.parentFolderId === currentFolderId);
      logger.info('Corporate subfolders', 'FileBrowser', {
        currentFolderId,
        subfolders: subfolders.length,
        subfolderNames: subfolders.map(f => f.name)
      });
      return subfolders;
    } else {
      // In Community view - show community folders
      if (!currentFolderId) {
        // Root level - show folders with no parent
        return folders.filter(f => !f.parentFolderId);
      }
      // Show folders that have current folder as parent
      return folders.filter(f => f.parentFolderId === currentFolderId);
    }
  };

  // Handle folder click - navigate into folder
  const handleFolderClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, folder]);
  };

  // Handle Corporate Files virtual folder click
  const handleCorporateFolderClick = () => {
    setIsCorporateView(true);
    setCurrentFolderId(null); // Root of Corporate structure
    setFolderPath([{ 
      id: 'corporate-virtual', 
      name: 'Corporate Files', 
      folderType: 'Corporate',
      isVirtual: true 
    } as Folder]);
  };

  // Handle breadcrumb click - navigate back
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go to root
      setCurrentFolderId(null);
      setFolderPath([]);
      setIsCorporateView(false); // Exit Corporate view
    } else {
      // Navigate to specific folder in path
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[index].id);
      
      // Check if we're still in Corporate view
      if (newPath[0]?.id === 'corporate-virtual') {
        setIsCorporateView(true);
      } else {
        setIsCorporateView(false);
      }
    }
  };

  // Handle file preview
  const handlePreview = async (file: File) => {
    setPreviewFile(file);
    setIsLoadingPreview(true);
    setPreviewContent(null);

    try {
      // For images and PDFs, we can use blob URLs
      if (file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf') {
        const blob = await dataService.downloadFile(file.id);
        const url = window.URL.createObjectURL(blob);
        setPreviewContent(url);
      } 
      // For text files, fetch and display content
      else if (file.mimeType?.startsWith('text/')) {
        const blob = await dataService.downloadFile(file.id);
        const text = await blob.text();
        setPreviewContent(text);
      }
      // For other files, show message
      else {
        setPreviewContent(null);
      }
    } catch (error) {
      logger.error('Error loading file preview', 'FileBrowser', { fileId: file.id }, error as Error);
      alert('Failed to load file preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle file download
  const handleDownload = async (file: File) => {
    try {
      const blob = await dataService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Error downloading file', 'FileBrowser', { fileId: file.id }, error as Error);
      alert('Failed to download file');
    }
  };

  // Handle file delete
  const handleDeleteFile = async (file: File) => {
    // Corporate files are view-only - don't allow deletion from community view
    if ((file as any).isCorporate || (file as any).isViewOnly) {
      alert('Corporate files cannot be deleted from this view. Please use the Corporate file browser.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${file.fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataService.deleteFile(file.id);
      
      // Reload files after successful deletion
      let filesData: File[];
      if (isCorporateView) {
        filesData = await dataService.getCorporateFilesByFolderForCommunity(currentFolderId, communityId);
      } else {
        filesData = await dataService.getFilesByFolder(currentFolderId, communityId);
      }
      setFiles(filesData);
    } catch (error) {
      logger.error('Error deleting file', 'FileBrowser', { fileId: file.id }, error as Error);
      alert('Failed to delete file. Please try again.');
    }
  };

  // Close preview and clean up blob URLs
  const handleClosePreview = () => {
    if (previewContent && previewContent.startsWith('blob:')) {
      window.URL.revokeObjectURL(previewContent);
    }
    setPreviewFile(null);
    setPreviewContent(null);
  };

  // Handle upload button click
  const handleUploadClick = () => {
    if (!communityId) {
      alert('Please select a community first');
      return;
    }
    // Don't allow uploads in Corporate view (view-only)
    if (isCorporateView) {
      alert('Corporate files are view-only. Please use the Corporate file browser to upload files.');
      return;
    }
    fileInputRef.current?.click();
  };

  // Handle file selection and upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !communityId) return;

    const filesArray = Array.from(selectedFiles);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: filesArray.length, fileName: '' });

    const errors: string[] = [];
    const successes: string[] = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setUploadProgress({ current: i + 1, total: filesArray.length, fileName: file.name });

        try {
          // Log for debugging
          logger.info('Uploading file', 'FileBrowser', {
            fileName: file.name,
            currentFolderId,
            folderPath: folderPath.map(f => f.name).join(' -> '),
            progress: `${i + 1}/${filesArray.length}`
          });

          await dataService.uploadFile({
            file: file,
            CommunityID: communityId,
            FolderID: currentFolderId || null,
          });

          successes.push(file.name);
        } catch (error) {
          logger.error('Error uploading file', 'FileBrowser', { fileName: file.name }, error as Error);
          errors.push(file.name);
        }
      }

      // Reload files after all uploads complete
      let filesData: File[];
      if (isCorporateView) {
        filesData = await dataService.getCorporateFilesByFolderForCommunity(currentFolderId, communityId);
      } else {
        filesData = await dataService.getFilesByFolder(currentFolderId, communityId);
      }
      setFiles(filesData);

      // Show summary message
      if (errors.length > 0 && successes.length > 0) {
        alert(`Uploaded ${successes.length} file(s) successfully.\nFailed to upload: ${errors.join(', ')}`);
      } else if (errors.length > 0) {
        alert(`Failed to upload ${errors.length} file(s): ${errors.join(', ')}`);
      } else if (successes.length > 1) {
        alert(`Successfully uploaded ${successes.length} files!`);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Error during file upload process', 'FileBrowser', {}, error as Error);
      alert('An error occurred during upload. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Get file icon component
  const getFileIconComponent = (file: File) => {
    const iconType = getFileIcon(file.mimeType, file.fileType);
    switch (iconType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-blue-500" />;
      case 'pdf':
        return <DocumentIcon className="h-8 w-8 text-red-500" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const subfolders = getSubfolders();
  const currentPath = currentFolderId ? folderPath : [];

  // Header content
  const header = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Files</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedCommunity?.displayName || 'Community'} File Storage
          </p>
        </div>
        <button 
          onClick={handleUploadClick}
          disabled={isUploading || !communityId || isCorporateView}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5" />
          {isUploading && uploadProgress 
            ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` 
            : isUploading 
            ? 'Uploading...' 
            : 'Upload Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className={currentPath.length === 0 
              ? 'text-gray-900 dark:text-white font-medium' 
              : 'flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
          >
            {currentPath.length > 0 && <ArrowLeftIcon className="h-4 w-4" />}
            Root
          </button>
          {currentPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Content
  const content = (
    <div className="space-y-6">
      {/* Folders */}
      {(() => {
        // Add Corporate Files virtual folder at root level if not in Corporate view and Corporate folders exist
        const virtualCorporateFolder: Folder | null = 
          !isCorporateView && 
          !currentFolderId && 
          corporateFolders.length > 0 
            ? { 
                id: 'corporate-virtual', 
                name: 'Corporate Files', 
                folderType: 'Corporate',
                isVirtual: true 
              } as Folder 
            : null;
        
        const allFolders = virtualCorporateFolder 
          ? [virtualCorporateFolder, ...subfolders]
          : subfolders;
        
        const filteredSubfolders = allFolders.filter(folder =>
          !searchTerm ||
          folder.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filteredSubfolders.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Folders ({filteredSubfolders.length}{searchTerm && ` of ${allFolders.length}`})
              {currentFolderId && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  (in {folderPath[folderPath.length - 1]?.name || 'current folder'})
                </span>
              )}
              {!currentFolderId && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  (at root level)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubfolders.map((folder) => {
                const isVirtual = (folder as any).isVirtual;
                const isCorporate = folder.folderType === 'Corporate';
                
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      if (isVirtual) {
                        handleCorporateFolderClick();
                      } else {
                        handleFolderClick(folder);
                      }
                    }}
                    className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border transition-all text-left ${
                      isCorporate || isVirtual
                        ? 'border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
                    } hover:shadow-md`}
                  >
                    <FolderIcon className={`h-10 w-10 flex-shrink-0 ${isCorporate || isVirtual ? 'text-blue-500' : 'text-yellow-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{folder.name}</p>
                        {(isCorporate || isVirtual) && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded whitespace-nowrap">
                            View Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isVirtual ? 'Corporate Files (Linked)' : 'Folder'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* Files */}
      {isLoadingFiles ? (
        <div className="text-center py-8 text-gray-500">Loading files...</div>
      ) : files.length > 0 ? (
        <div>
          {(() => {
            const filteredFiles = files.filter(file => 
              !searchTerm || 
              file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return (
              <>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Files ({filteredFiles.length}{searchTerm && ` of ${files.length}`})
                  {currentFolderId && (
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      (in {folderPath[folderPath.length - 1]?.name || 'current folder'})
                    </span>
                  )}
                  {!currentFolderId && (
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      (at root level)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFiles.map((file) => {
              const canPreview = file.mimeType?.startsWith('image/') || 
                                file.mimeType === 'application/pdf' || 
                                file.mimeType?.startsWith('text/');
              
              // Format creation date
              const formatDate = (dateString: string): string => {
                try {
                  const date = new Date(dateString);
                  return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch {
                  return 'Unknown';
                }
              };
              
              return (
                <div
                  key={file.id}
                  className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    {getFileIconComponent(file)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white text-sm break-words">{file.fileName}</p>
                        {((file as any).isCorporate || (file as any).isViewOnly) && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded whitespace-nowrap flex-shrink-0">
                            Corporate
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between gap-4">
                        <div>{formatFileSize(file.fileSize)}</div>
                        {file.createdOn && (
                          <div className="text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {formatDate(file.createdOn)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                    {/* Indexing Status Badge for PDFs - Left side */}
                    {file.mimeType === 'application/pdf' && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          file.isIndexed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : file.indexingError
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                        title={
                          file.isIndexed
                            ? `Indexed on ${file.lastIndexedDate ? formatDate(file.lastIndexedDate) : 'Unknown'}`
                            : file.indexingError
                            ? `Indexing failed: ${file.indexingError.substring(0, 50)}...`
                            : 'Not indexed yet'
                        }
                      >
                        {file.isIndexed ? '✓ Indexed' : file.indexingError ? '✗ Error' : '○ Pending'}
                      </span>
                    )}
                    {/* Action buttons - Right side */}
                    <div className="flex items-center gap-1 ml-auto">
                      {canPreview && (
                        <button
                          onClick={() => handlePreview(file)}
                          className="p-1.5 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Preview"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      {/* Hide delete button for Corporate files (view-only) */}
                      {!((file as any).isCorporate || (file as any).isViewOnly) && (
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
                </div>
              </>
            );
          })()}
        </div>
      ) : !isLoading && subfolders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FolderIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium">No folders or files</p>
          <p className="text-sm mt-1">Upload files to get started</p>
        </div>
      ) : null}
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Determine preview type
  const getPreviewType = (): 'image' | 'pdf' | 'text' | 'unsupported' => {
    if (!previewFile) return 'unsupported';
    if (previewFile.mimeType?.startsWith('image/')) return 'image';
    if (previewFile.mimeType === 'application/pdf') return 'pdf';
    if (previewFile.mimeType?.startsWith('text/')) return 'text';
    return 'unsupported';
  };

  return (
    <>
      <InfoViewTemplate
        header={header}
        contentClassName="pb-8"
      >
        {content}
      </InfoViewTemplate>

      {/* File Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={handleClosePreview}
        title={previewFile?.fileName || 'File Preview'}
        maxWidth="6xl"
      >
        {isLoadingPreview ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading preview...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {getPreviewType() === 'image' && previewContent && (
              <div className="flex justify-center">
                <img 
                  src={previewContent} 
                  alt={previewFile?.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
            
            {getPreviewType() === 'pdf' && previewContent && (
              <div className="w-full h-[70vh]">
                <iframe
                  src={previewContent}
                  className="w-full h-full border border-gray-300 dark:border-gray-700 rounded-lg"
                  title={previewFile?.fileName}
                />
              </div>
            )}
            
            {getPreviewType() === 'text' && previewContent && (
              <div className="w-full h-[70vh] overflow-auto">
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-mono whitespace-pre-wrap break-words">
                  {previewContent}
                </pre>
              </div>
            )}
            
            {getPreviewType() === 'unsupported' && (
              <div className="text-center py-12">
                <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Preview not available for this file type
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Please download the file to view it
                </p>
              </div>
            )}

            {/* Download button */}
            {previewFile && (
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    if (previewFile) {
                      handleDownload(previewFile);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default FileBrowser;

