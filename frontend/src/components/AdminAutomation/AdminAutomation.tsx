import React, { useState } from 'react';
import { CogIcon, DocumentTextIcon, SparklesIcon, ClipboardDocumentIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal/Modal';
import dataService from '../../services/dataService';
import logger from '../../services/logger';

const AdminAutomation: React.FC = () => {
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingResults, setIndexingResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    errors: Array<{ fileId: string; fileName: string; error: string }>;
    skippedFiles?: Array<{ fileId: string; fileName: string; reason: string; error?: string | null }>;
    processedFiles?: Array<{
      fileId: string;
      fileName: string;
      status: 'success' | 'skipped' | 'failed' | 'processing';
      timestamp: string;
      details: any;
    }>;
  } | null>(null);
  const [showDetailedLog, setShowDetailedLog] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResults, setResetResults] = useState<{ affectedRows: number } | null>(null);

  const handleOpenIndexModal = () => {
    setShowIndexModal(true);
    setIndexingResults(null);
    setIndexingProgress('');
  };

  const handleCloseModal = () => {
    if (!isIndexing) {
      setShowIndexModal(false);
      setIndexingResults(null);
      setIndexingProgress('');
    }
  };

  const handleIndexDocuments = async () => {
    setIsIndexing(true);
    setIndexingProgress('Starting document indexing...');
    setIndexingResults(null);
    setResetResults(null);

    try {
      setIndexingProgress('Processing PDF files...');
      const results = await dataService.indexDocuments();
      
      setIndexingResults(results);
      setIndexingProgress('Indexing completed!');
      
      logger.info('Document indexing completed', 'AdminAutomation', results);
    } catch (error) {
      logger.error('Error indexing documents', 'AdminAutomation', {}, error as Error);
      setIndexingProgress('Error: ' + (error as Error).message);
      setIndexingResults({
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: [{ fileId: '', fileName: 'Error', error: (error as Error).message }]
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const handleResetFailedFiles = async () => {
    setIsResetting(true);
    setResetResults(null);
    setIndexingResults(null);
    setIndexingProgress('Resetting failed indexing attempts...');

    try {
      const results = await dataService.resetFailedIndexes();
      setResetResults(results);
      setIndexingProgress(`Reset ${results.affectedRows} failed files. They will be re-indexed on the next run.`);
      logger.info('Reset failed indexes', 'AdminAutomation', results);
    } catch (error) {
      logger.error('Error resetting failed indexes', 'AdminAutomation', {}, error as Error);
      setIndexingProgress('Error: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Admin Automation</h2>
          <p className="text-secondary">
            Run automated scripts and processes for system maintenance and AI features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Document Indexing Button */}
          <button
            onClick={handleOpenIndexModal}
            className="flex flex-col items-center justify-center p-8 bg-surface border border-primary rounded-lg hover:border-royal-600 hover:shadow-lg transition-all group"
          >
            <div className="mb-4 p-4 bg-royal-600/10 rounded-full group-hover:bg-royal-600/20 transition-colors">
              <SparklesIcon className="w-12 h-12 text-royal-600" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Index Documents</h3>
            <p className="text-sm text-secondary text-center">
              Process and index all PDF files for AI document search
            </p>
          </button>

          {/* Placeholder for future automations */}
          <div className="flex flex-col items-center justify-center p-8 bg-surface border border-primary rounded-lg opacity-50">
            <div className="mb-4 p-4 bg-gray-600/10 rounded-full">
              <CogIcon className="w-12 h-12 text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-tertiary mb-2">Coming Soon</h3>
            <p className="text-sm text-tertiary text-center">
              More automation scripts will be available here
            </p>
          </div>
        </div>
      </div>

      {/* Document Indexing Modal */}
      {showIndexModal && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Index Documents for AI Search"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">What does this do?</h4>
              <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
                <li>Scans all PDF files in the system</li>
                <li>Extracts text content from each PDF</li>
                <li>Creates searchable embeddings for AI queries</li>
                <li>Only processes files that haven't been indexed yet</li>
                <li>Automatically skips files that are already indexed</li>
              </ul>
            </div>

            {indexingProgress && (
              <div className={`p-3 rounded-lg ${
                indexingProgress.includes('Error')
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}>
                <p className={`text-sm ${
                  indexingProgress.includes('Error')
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {indexingProgress}
                </p>
              </div>
            )}

            {resetResults && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ Reset Complete</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {resetResults.affectedRows} file(s) have been reset and will be re-indexed on the next run.
                </p>
              </div>
            )}

            {indexingResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-primary">Indexing Results</h4>
                  {indexingResults.processedFiles && indexingResults.processedFiles.length > 0 && (
                    <button
                      onClick={() => setShowDetailedLog(!showDetailedLog)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-royal-600 text-white rounded-lg hover:bg-royal-700 transition-colors"
                    >
                      {showDetailedLog ? (
                        <>
                          <ChevronDownIcon className="w-4 h-4" />
                          Hide Detailed Log
                        </>
                      ) : (
                        <>
                          <ChevronRightIcon className="w-4 h-4" />
                          Show Detailed Log
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface border border-primary rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">{indexingResults.total}</div>
                    <div className="text-sm text-secondary">Total Files</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">{indexingResults.successful}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Successfully Indexed</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{indexingResults.skipped}</div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">Skipped</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-800 dark:text-red-200">{indexingResults.failed}</div>
                    <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                  </div>
                </div>

                {/* Detailed Log Panel */}
                {showDetailedLog && indexingResults.processedFiles && indexingResults.processedFiles.length > 0 && (
                  <div className="mt-4 border border-primary rounded-lg bg-surface">
                    <div className="flex items-center justify-between p-3 border-b border-primary bg-royal-600/10">
                      <h5 className="font-semibold text-primary">Detailed Processing Log</h5>
                      <button
                        onClick={() => {
                          const logText = indexingResults.processedFiles!.map(file => {
                            const timestamp = new Date(file.timestamp).toLocaleString();
                            let status = '';
                            let details = '';
                            
                            if (file.status === 'success') {
                              status = '✓ SUCCESS';
                              details = `Chunks: ${file.details.chunksCount || 0}, Pages: ${file.details.numPages || 0}, Text Length: ${file.details.textLength || 0}`;
                              if (file.details.financialDataExtracted) {
                                details += ', Financial Data Extracted: Yes';
                              }
                              if (file.details.vectorIndexingSkipped) {
                                details += ' (Vector indexing skipped - already indexed)';
                              }
                            } else if (file.status === 'skipped') {
                              status = '⊘ SKIPPED';
                              details = `Reason: ${file.details.reason || 'Unknown'}`;
                              if (file.details.error) {
                                details += `, Error: ${file.details.error}`;
                              }
                            } else if (file.status === 'failed') {
                              status = '✗ FAILED';
                              details = `Error: ${file.details.error || 'Unknown error'}`;
                            }
                            
                            return `[${timestamp}] ${status} - ${file.fileName}\n  ${details}`;
                          }).join('\n\n');
                          
                          navigator.clipboard.writeText(logText);
                          alert('Log copied to clipboard!');
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-royal-600 text-white rounded hover:bg-royal-700 transition-colors"
                        title="Copy full log to clipboard"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Copy Log
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-3 space-y-2 font-mono text-xs">
                      {indexingResults.processedFiles.map((file, index) => {
                        const timestamp = new Date(file.timestamp).toLocaleString();
                        let statusColor = '';
                        let statusIcon = '';
                        let statusText = '';
                        
                        if (file.status === 'success') {
                          statusColor = 'text-green-600 dark:text-green-400';
                          statusIcon = '✓';
                          statusText = 'SUCCESS';
                        } else if (file.status === 'skipped') {
                          statusColor = 'text-yellow-600 dark:text-yellow-400';
                          statusIcon = '⊘';
                          statusText = 'SKIPPED';
                        } else if (file.status === 'failed') {
                          statusColor = 'text-red-600 dark:text-red-400';
                          statusIcon = '✗';
                          statusText = 'FAILED';
                        }
                        
                        return (
                          <div key={index} className="border-b border-primary/20 pb-2 last:border-b-0">
                            <div className="flex items-start gap-2">
                              <span className={`font-bold ${statusColor} flex-shrink-0`}>
                                [{timestamp}] {statusIcon} {statusText}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-primary break-words">{file.fileName}</div>
                                <div className="text-secondary mt-1 space-y-0.5">
                                  {file.status === 'success' && (
                                    <>
                                      <div>Chunks: {file.details.chunksCount || 0} | Pages: {file.details.numPages || 0} | Text Length: {file.details.textLength || 0} chars</div>
                                      {file.details.financialDataExtracted && (
                                        <div className="text-green-600 dark:text-green-400">✓ Financial data extracted and saved to database</div>
                                      )}
                                      {file.details.vectorIndexingSkipped && (
                                        <div className="text-blue-600 dark:text-blue-400">ℹ Vector indexing skipped (file already indexed)</div>
                                      )}
                                    </>
                                  )}
                                  {file.status === 'skipped' && (
                                    <div>
                                      <span className="font-medium">Reason:</span> {file.details.reason || 'Unknown'}
                                      {file.details.error && (
                                        <div className="text-red-600 dark:text-red-400 mt-1">
                                          <span className="font-medium">Error:</span> {file.details.error}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {file.status === 'failed' && (
                                    <div className="text-red-600 dark:text-red-400">
                                      <span className="font-medium">Error:</span> {file.details.error || 'Unknown error'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {indexingResults.errors.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-primary mb-2">Errors:</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {indexingResults.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          <span className="font-medium">{error.fileName}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-4 border-t border-primary">
              {/* Reset Failed Files Button - Left side */}
              {indexingResults && indexingResults.failed > 0 && !isResetting && (
                <button
                  onClick={handleResetFailedFiles}
                  disabled={isIndexing || isResetting}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Clear errors and mark failed files for re-indexing"
                >
                  {isResetting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Failed Files'
                  )}
                </button>
              )}
              
              {/* Action buttons - Right side */}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={handleCloseModal}
                  disabled={isIndexing || isResetting}
                  className="px-4 py-2 bg-tertiary text-white rounded-lg hover:bg-tertiary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {indexingResults || resetResults ? 'Close' : 'Cancel'}
                </button>
                {!indexingResults && !resetResults && (
                  <button
                    onClick={handleIndexDocuments}
                    disabled={isIndexing || isResetting}
                    className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isIndexing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Indexing...
                      </>
                    ) : (
                      'Start Indexing'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminAutomation;

