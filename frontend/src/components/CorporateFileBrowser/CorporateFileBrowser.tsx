import React, { useState, useEffect } from 'react';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
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

const CorporateFileBrowser: React.FC = () => {
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
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const foldersData = await dataService.getCorporateFolders();
        setFolders(foldersData);
      } catch (error) {
        logger.error('Error loading corporate folders', 'CorporateFileBrowser', {}, error as Error);
      }
    };

    loadFolders();
  }, []);

  // Load files when folder changes or on initial load
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const filesData = await dataService.getCorporateFilesByFolder(currentFolderId);
        setFiles(filesData);
        // Clear search when folder changes
        setSearchTerm('');
      } catch (error) {
        logger.error('Error loading corporate files', 'CorporateFileBrowser', { folderId: currentFolderId }, error as Error);
      } finally {
        setIsLoadingFiles(false);
        setIsLoading(false); // Also clear initial loading state
      }
    };

    loadFiles();
  }, [currentFolderId]);

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
      logger.error('Error loading file preview', 'CorporateFileBrowser', { fileId: file.id }, error as Error);
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
      logger.error('Error downloading file', 'CorporateFileBrowser', { fileId: file.id }, error as Error);
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
      const filesData = await dataService.getCorporateFilesByFolder(currentFolderId);
      setFiles(filesData);
    } catch (error) {
      logger.error('Error deleting file', 'CorporateFileBrowser', { fileId: file.id }, error as Error);
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
    fileInputRef.current?.click();
  };

  // Handle file selection and upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await dataService.uploadFile({
        file: selectedFile,
        CommunityID: null, // Corporate files have no CommunityID
        FolderID: currentFolderId,
        FolderType: 'Corporate'
      });
      
      // Reload files after successful upload
      const filesData = await dataService.getCorporateFilesByFolder(currentFolderId);
      setFiles(filesData);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error('Error uploading file', 'CorporateFileBrowser', { fileName: selectedFile.name }, error as Error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    setIsCreatingFolder(true);
    try {
      await dataService.createFolder({
        FolderName: newFolderName.trim(),
        ParentFolderID: currentFolderId,
        CommunityID: null, // Corporate folders have no CommunityID
        FolderType: 'Corporate'
      });
      
      // Reload folders after successful creation
      const foldersData = await dataService.getCorporateFolders();
      setFolders(foldersData);
      
      // Reset form
      setNewFolderName('');
      setShowCreateFolderModal(false);
    } catch (error) {
      logger.error('Error creating folder', 'CorporateFileBrowser', { folderName: newFolderName }, error as Error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const subfolders = getSubfolders();
  const subfoldersCount = subfolders.length;
  const filesCount = files.length;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 bg-surface-secondary border-b border-primary p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary">Corporate Files</h2>
                <p className="text-sm text-secondary mt-1">
                  Manage corporate-wide files and folders (separate from community files)
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Folder
                </button>
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="w-5 h-5" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-secondary">
              <button
                onClick={() => handleBreadcrumbClick(-1)}
                className={folderPath.length === 0 ? 'text-primary font-medium' : 'hover:text-primary transition-colors'}
              >
                Root
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span className="text-tertiary">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className="hover:text-primary transition-colors"
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm bg-surface border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-royal-600 w-64"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area with Dark Background */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-surface-secondary p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-secondary">Loading...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Folders */}
              {(() => {
                const filteredSubfolders = subfolders.filter(folder =>
                  !searchTerm ||
                  folder.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                return filteredSubfolders.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-4">
                      Folders ({filteredSubfolders.length}{searchTerm && ` of ${subfoldersCount}`})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSubfolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderClick(folder)}
                        className="flex items-center gap-3 p-4 bg-surface border border-primary rounded-lg hover:border-royal-600 hover:shadow-md transition-all text-left"
                      >
                        <FolderIcon className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-primary truncate">{folder.name}</div>
                        </div>
                      </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Files */}
              {isLoadingFiles ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-secondary">Loading files...</div>
                </div>
              ) : filesCount > 0 ? (
                <div>
                  {(() => {
                    const filteredFiles = files.filter(file => 
                      !searchTerm || 
                      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return (
                      <>
                        <h3 className="text-lg font-medium text-primary mb-4">
                          Files ({filteredFiles.length}{searchTerm && ` of ${files.length}`})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredFiles.map((file) => {
                      const iconType = getFileIcon(file.mimeType, file.fileType);
                      const IconComponent = iconType === 'image' ? PhotoIcon : DocumentIcon;
                      
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
                          className="bg-surface border border-primary rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <IconComponent className="w-8 h-8 text-tertiary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-primary break-words" title={file.fileName}>
                                {file.fileName}
                              </div>
                              <div className="text-sm text-secondary mt-1 flex items-center justify-between gap-4">
                                <div>{formatFileSize(file.fileSize)}</div>
                                {file.createdOn && (
                                  <div className="text-xs text-tertiary whitespace-nowrap">
                                    {formatDate(file.createdOn)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-primary">
                            <button
                              onClick={() => handlePreview(file)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-tertiary hover:bg-surface-tertiary rounded transition-colors"
                              title="View"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(file)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-tertiary hover:bg-surface-tertiary rounded transition-colors"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
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
              ) : (
                <div className="text-center py-12 text-secondary">
                  {(() => {
                    const filteredSubfolders = subfolders.filter(folder =>
                      !searchTerm ||
                      folder.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    const filteredFiles = files.filter(file =>
                      !searchTerm ||
                      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    if (searchTerm && filteredSubfolders.length === 0 && filteredFiles.length === 0) {
                      return 'No files or folders match your search.';
                    }
                    return subfoldersCount === 0 && filesCount === 0
                      ? 'No folders or files yet. Create a folder or upload a file to get started.'
                      : 'No files in this folder.';
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <Modal
          isOpen={true}
          onClose={handleClosePreview}
          title={previewFile.fileName}
        >
          <div className="max-w-4xl max-h-[80vh] overflow-auto">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading preview...</div>
              </div>
            ) : previewContent ? (
              <>
                {previewFile.mimeType?.startsWith('image/') && (
                  <img src={previewContent} alt={previewFile.fileName} className="max-w-full h-auto" />
                )}
                {previewFile.mimeType === 'application/pdf' && (
                  <iframe src={previewContent} className="w-full h-[600px] border-0" title={previewFile.fileName} />
                )}
                {previewFile.mimeType?.startsWith('text/') && (
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border">{previewContent}</pre>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Preview not available for this file type.
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowCreateFolderModal(false);
            setNewFolderName('');
          }}
          title="Create Folder"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
                className="w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-600"
                placeholder="Enter folder name"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingFolder ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CorporateFileBrowser;

