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
  const [files, setFiles] = useState<File[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]); // Breadcrumb path
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        const foldersData = await dataService.getFoldersByCommunity(communityId);
        setFolders(foldersData);
      } catch (error) {
        logger.error('Error loading folders', 'FileBrowser', { communityId }, error as Error);
      }
    };

    loadFolders();
  }, [communityId]);

  // Load files when folder changes or on initial load
  useEffect(() => {
    if (!communityId) return;

    const loadFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const filesData = await dataService.getFilesByFolder(currentFolderId, communityId);
        setFiles(filesData);
        // Clear search when folder changes
        setSearchTerm('');
      } catch (error) {
        logger.error('Error loading files', 'FileBrowser', { folderId: currentFolderId }, error as Error);
      } finally {
        setIsLoadingFiles(false);
        setIsLoading(false); // Also clear initial loading state
      }
    };

    loadFiles();
  }, [currentFolderId, communityId]);

  // Get subfolders for current folder
  const getSubfolders = (): Folder[] => {
    if (!currentFolderId) {
      // Root level - show folders with no parent
      return folders.filter(f => !f.parentFolderId);
    }
    // Show folders that have current folder as parent
    return folders.filter(f => f.parentFolderId === currentFolderId);
  };

  // Handle folder click - navigate into folder
  const handleFolderClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, folder]);
  };

  // Handle breadcrumb click - navigate back
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go to root
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      // Navigate to specific folder in path
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[index].id);
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
    if (!confirm(`Are you sure you want to delete "${file.fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataService.deleteFile(file.id);
      
      // Reload files after successful deletion
      const filesData = await dataService.getFilesByFolder(currentFolderId, communityId);
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
    fileInputRef.current?.click();
  };

  // Handle file selection and upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !communityId) return;

    setIsUploading(true);
    try {
      // Log for debugging
      logger.info('Uploading file', 'FileBrowser', {
        fileName: selectedFile.name,
        currentFolderId,
        folderPath: folderPath.map(f => f.name).join(' -> ')
      });

      await dataService.uploadFile({
        file: selectedFile,
        CommunityID: communityId,
        FolderID: currentFolderId || null,
      });

      // Reload files after successful upload
      const filesData = await dataService.getFilesByFolder(currentFolderId, communityId);
      setFiles(filesData);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Error uploading file', 'FileBrowser', { fileName: selectedFile.name }, error as Error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
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
          disabled={isUploading || !communityId}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5" />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
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
        const filteredSubfolders = subfolders.filter(folder =>
          !searchTerm ||
          folder.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filteredSubfolders.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Folders ({filteredSubfolders.length}{searchTerm && ` of ${subfolders.length}`})
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
              {filteredSubfolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <FolderIcon className="h-10 w-10 text-yellow-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{folder.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Folder</p>
                </div>
              </button>
              ))}
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
                      <p className="font-medium text-gray-900 dark:text-white text-sm break-words">{file.fileName}</p>
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
                  <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-gray-200 dark:border-gray-700">
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
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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

