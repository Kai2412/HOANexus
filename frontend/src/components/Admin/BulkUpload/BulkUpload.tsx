import React, { useState, useRef } from 'react';
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import dataService from '../../../services/dataService';

interface ValidationResult {
  row: number;
  data: Record<string, string>;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
}

interface BulkUploadProps {
  onBack?: () => void;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onBack }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const blob = await dataService.downloadCommunitiesTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'communities-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    await validateFile(selectedFile);
  };

  const validateFile = async (fileToValidate: File) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dataService.validateCommunitiesCSV(fileToValidate);
      
      if (response.success) {
        setValidationResults(response.data.results);
        setDuplicates(response.data.duplicates || []);
        
        // Auto-select valid rows (not errors, not database duplicates)
        const validRowNumbers = response.data.results
          .filter((r: ValidationResult) => {
            if (r.status === 'error') return false;
            // Auto-deselect database duplicates
            const isDbDuplicate = response.data.duplicates?.some(
              (d: any) => d.row === r.row && d.source === 'database'
            );
            return !isDbDuplicate;
          })
          .map((r: ValidationResult) => r.row);
        setSelectedRows(new Set(validRowNumbers));
        setStep('preview');
      } else {
        setError(response.message || 'Validation failed');
      }
    } catch (err: any) {
      // Try to extract error message from various possible locations
      let errorMessage = 'Failed to validate file';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.errorData?.error) {
        errorMessage = err.errorData.error;
      } else if (err.errorData?.message) {
        errorMessage = err.errorData.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
      console.error('Validation error details:', {
        message: err.message,
        errorData: err.errorData,
        status: err.status,
        fullError: err
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRowSelection = (rowNumber: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowNumber)) {
      newSelected.delete(rowNumber);
    } else {
      newSelected.add(rowNumber);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    const importableRows = validationResults
      .filter(r => r.status !== 'error')
      .map(r => r.row);
    
    if (importableRows.every(row => selectedRows.has(row))) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all importable
      setSelectedRows(new Set(importableRows));
    }
  };

  const handleImport = async () => {
    const rowsToImport = validationResults.filter(r => 
      selectedRows.has(r.row) && r.status !== 'error'
    );

    if (rowsToImport.length === 0) {
      setError('Please select at least one row to import');
      return;
    }

    try {
      setStep('importing');
      setLoading(true);
      setError(null);

      const response = await dataService.importCommunities(rowsToImport, 'update');

      if (response.success) {
        setImportResults(response.data);
        setStep('results');
      } else {
        setError(response.message || 'Import failed');
        setStep('preview');
      }
    } catch (err: any) {
      let errorMessage = 'Import failed';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.errorData?.error) {
        errorMessage = err.errorData.error;
      } else if (err.errorData?.message) {
        errorMessage = err.errorData.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationResults([]);
    setDuplicates([]);
    setSelectedRows(new Set());
    setError(null);
    setImportResults(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      valid: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status as keyof typeof classes]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="space-y-6">
          {/* Download Template */}
          <div className="bg-surface-secondary rounded-lg border border-primary p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Step 1: Download Template</h3>
                <p className="text-sm text-secondary">
                  Download the CSV template with example data and instructions. Fill it out and remove the example row before uploading.
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download Template</span>
              </button>
            </div>
          </div>

          {/* Upload File */}
          <div className="bg-surface-secondary rounded-lg border border-primary p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Step 2: Upload CSV File</h3>
            <div
              className="border-2 border-dashed border-primary rounded-lg p-8 text-center hover:border-royal-600 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowUpTrayIcon className="w-12 h-12 text-tertiary mx-auto mb-4" />
              <p className="text-primary font-medium mb-2">
                {file ? file.name : 'Click to select CSV file or drag and drop'}
              </p>
              <p className="text-sm text-secondary">CSV files only (max 10MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {file && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-secondary">Selected: {file.name}</span>
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-600 mx-auto mb-2"></div>
              <p className="text-secondary">Validating file...</p>
            </div>
          )}
        </div>
    );
  }

  // Preview Step
  if (step === 'preview') {
    // Separate duplicates by source
    const uploadDuplicates = duplicates.filter(d => d.source === 'upload');
    const databaseDuplicates = duplicates.filter(d => d.source === 'database');
    const uploadDuplicateRows = new Set(uploadDuplicates.map(d => d.row));
    const databaseDuplicateRows = new Set(databaseDuplicates.map(d => d.row));
    
    // Group upload duplicates by value to count duplicate groups (not individual records)
    const uploadDuplicateGroups = new Map<string, number[]>(); // value -> [row numbers]
    uploadDuplicates.forEach(dup => {
      const key = dup.value;
      if (!uploadDuplicateGroups.has(key)) {
        uploadDuplicateGroups.set(key, []);
      }
      uploadDuplicateGroups.get(key)!.push(dup.row);
    });
    // Remove duplicates from row arrays
    uploadDuplicateGroups.forEach((rows, key) => {
      uploadDuplicateGroups.set(key, [...new Set(rows)]);
    });
    const uploadDuplicateGroupCount = uploadDuplicateGroups.size;
    
    // Check which duplicate groups have multiple rows selected
    const unresolvedUploadDuplicates = Array.from(uploadDuplicateGroups.entries()).filter(([value, rows]) => {
      const selectedCount = rows.filter(row => selectedRows.has(row)).length;
      return selectedCount > 1; // More than 1 selected = unresolved
    });
    
    // Check if any upload duplicates are selected (for warning display)
    const selectedUploadDuplicates = validationResults.filter(r => 
      selectedRows.has(r.row) && uploadDuplicateRows.has(r.row)
    );
    
    // Check if any database duplicates are selected
    const selectedDatabaseDuplicates = validationResults.filter(r => 
      selectedRows.has(r.row) && databaseDuplicateRows.has(r.row)
    );
    
    // Helper function to get effective status for a row (considering duplicate resolution)
    const getEffectiveStatus = (result: ValidationResult): 'valid' | 'warning' | 'error' => {
      if (result.status === 'error') return 'error';
      
      // Check if this row is part of an upload duplicate group
      if (uploadDuplicateRows.has(result.row)) {
        // Find which duplicate group this row belongs to
        for (const [value, rows] of uploadDuplicateGroups.entries()) {
          if (rows.includes(result.row)) {
            const selectedCount = rows.filter(row => selectedRows.has(row)).length;
            // If only 1 row from this group is selected, it's resolved (valid)
            // If more than 1 is selected, it's unresolved (warning)
            if (selectedCount <= 1) {
              return 'valid';
            } else {
              return 'warning';
            }
          }
        }
      }
      
      // Default to original status
      return result.status;
    };
    
    // Calculate counts based on effective status (considers duplicate resolution)
    const validCount = validationResults.filter(r => getEffectiveStatus(r) === 'valid').length;
    const warningCount = validationResults.filter(r => getEffectiveStatus(r) === 'warning').length;
    const errorCount = validationResults.filter(r => r.status === 'error').length;
    const selectedCount = validationResults.filter(r => 
      selectedRows.has(r.row) && r.status !== 'error'
    ).length;
    const importableRows = validationResults.filter(r => r.status !== 'error');
    const allSelected = importableRows.length > 0 && importableRows.every(r => selectedRows.has(r.row));

    return (
      <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validCount}</div>
              <div className="text-sm text-secondary">Valid</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount}</div>
              <div className="text-sm text-secondary">Warnings</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</div>
              <div className="text-sm text-secondary">Errors</div>
            </div>
            <div className="bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-royal-600 dark:text-royal-400">{selectedCount}</div>
              <div className="text-sm text-secondary">Selected</div>
            </div>
          </div>

          {/* Upload Duplicates Warning (within CSV) */}
          {uploadDuplicateGroupCount > 0 && unresolvedUploadDuplicates.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                    {uploadDuplicateGroupCount} duplicate group(s) found within upload
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Multiple rows have the same PropertyCode or DisplayName/LegalName combination. Please select only 1 of each duplicate group and unselect the others before importing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Database Duplicates Warning */}
          {databaseDuplicateRows.size > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-800 dark:text-orange-200 font-semibold">
                    {selectedDatabaseDuplicates.length > 0 
                      ? `${selectedDatabaseDuplicates.length} duplicate(s) selected will update existing communities`
                      : `${databaseDuplicateRows.size} row(s) match existing communities (auto-deselected)`
                    }
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {selectedDatabaseDuplicates.length > 0
                      ? 'If you proceed, these rows will override existing community data in the database. Deselect them if you do not want to update existing records.'
                      : 'These rows match existing communities and have been automatically deselected. Select them if you want to update the existing records with new data.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Info */}
          {errorCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold">
                ⚠️ {errorCount} row(s) have errors and cannot be imported. Fix errors in your CSV file and re-upload to proceed.
              </p>
            </div>
          )}

          {/* Preview Table */}
          <div className="bg-surface-secondary rounded-lg border border-primary overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAllRows}
                        className="w-4 h-4 text-royal-600 rounded focus:ring-royal-500"
                        title="Select/Deselect all importable rows"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Property Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Display Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Legal Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Client Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary">
                  {validationResults.map((result) => {
                    const isUploadDuplicate = uploadDuplicateRows.has(result.row);
                    const isDatabaseDuplicate = databaseDuplicateRows.has(result.row);
                    const isDuplicate = isUploadDuplicate || isDatabaseDuplicate;
                    const isSelected = selectedRows.has(result.row);
                    const canSelect = result.status !== 'error';
                    
                    // Get effective status (considers if duplicates are resolved)
                    const effectiveStatus = getEffectiveStatus(result);
                    
                    return (
                      <tr 
                        key={result.row} 
                        className={`hover:bg-surface-tertiary ${
                          isUploadDuplicate ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                        } ${result.status === 'error' ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(result.row)}
                            disabled={!canSelect}
                            className="w-4 h-4 text-royal-600 rounded focus:ring-royal-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={!canSelect ? 'Cannot import rows with errors' : isUploadDuplicate ? 'Duplicate - select only 1 from each duplicate group' : isDatabaseDuplicate ? 'Matches existing community - will update if selected' : 'Select to import'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {getStatusIcon(effectiveStatus)}
                        </td>
                        <td className="px-4 py-3 text-sm text-primary">{result.row}</td>
                        <td className="px-4 py-3 text-sm text-primary">{result.data.PropertyCode || '-'}</td>
                        <td className="px-4 py-3 text-sm text-primary">{result.data.DisplayName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-primary">{result.data.LegalName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-primary">{result.data.ClientType || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {isUploadDuplicate && effectiveStatus === 'warning' && (
                            <div className="text-yellow-600 dark:text-yellow-400 font-medium mb-1">
                              ⚠ Duplicate (select only 1)
                            </div>
                          )}
                          {isDatabaseDuplicate && (
                            <div className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                              ⚠ Matches existing
                            </div>
                          )}
                          {result.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">
                              {result.errors.map((err, idx) => (
                                <div key={idx}>• {err}</div>
                              ))}
                            </div>
                          )}
                          {result.warnings.length > 0 && (
                            <div className="text-yellow-600 dark:text-yellow-400">
                              {result.warnings.map((warn, idx) => (
                                <div key={idx}>• {warn}</div>
                              ))}
                            </div>
                          )}
                          {result.errors.length === 0 && result.warnings.length === 0 && effectiveStatus === 'valid' && (
                            <span className="text-green-600 dark:text-green-400">✓ Valid</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0 || loading || unresolvedUploadDuplicates.length > 0}
              className="px-6 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              title={unresolvedUploadDuplicates.length > 0 ? 'Please resolve duplicate entries within upload before importing' : undefined}
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              <span>Import {selectedCount} {selectedCount === 1 ? 'Community' : 'Communities'}</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>
    );
  }

  // Importing Step
  if (step === 'importing') {
    return (
      <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-royal-600 mx-auto mb-4"></div>
          <p className="text-lg text-primary font-medium mb-2">Processing import...</p>
          <p className="text-sm text-secondary">This may take a few moments. Please do not close this window.</p>
        </div>
    );
  }

  // Results Step
  if (step === 'results' && importResults) {
    return (
      <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                Import Successful!
              </h3>
            </div>
            <p className="text-green-700 dark:text-green-300">
              Successfully imported {importResults.succeeded} of {importResults.total} communities.
            </p>
          </div>

          {importResults.failed > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Failed: {importResults.failed} communities
              </h4>
              {importResults.errors && importResults.errors.length > 0 && (
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                  {importResults.errors.slice(0, 10).map((err: any, idx: number) => (
                    <li key={idx}>Row {err.row}: {err.error}</li>
                  ))}
                  {importResults.errors.length > 10 && (
                    <li>... and {importResults.errors.length - 10} more errors</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors"
            >
              Upload Another File
            </button>
          </div>
        </div>
    );
  }

  return null;
};

export default BulkUpload;

