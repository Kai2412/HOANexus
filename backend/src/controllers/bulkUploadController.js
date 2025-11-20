const Community = require('../models/community');
const { logger } = require('../utils/logger');
const { getConnection } = require('../config/database');
const { sql } = require('../config/database');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Generate CSV template for Communities bulk upload
 */
const generateCommunitiesTemplate = async (_req, res) => {
  try {
    // Get all dropdown options for reference
    const pool = await getConnection();
    
    // Get dropdown options
    const dropdowns = await pool.request().query(`
      SELECT GroupID, ChoiceValue, IsDefault
      FROM dbo.cor_DynamicDropChoices
      WHERE GroupID IN ('client-types', 'service-types', 'management-types', 'development-stages', 'acquisition-types', 'status')
        AND IsActive = 1
      ORDER BY GroupID, DisplayOrder
    `);

    const dropdownMap = {};
    dropdowns.recordset.forEach(row => {
      if (!dropdownMap[row.GroupID]) {
        dropdownMap[row.GroupID] = [];
      }
      dropdownMap[row.GroupID].push(row.ChoiceValue);
    });

    // Build CSV template
    const headers = [
      'PropertyCode',
      'DisplayName',
      'LegalName',
      'ClientType',
      'ServiceType',
      'ManagementType',
      'DevelopmentStage',
      'CommunityStatus',
      'BuiltOutUnits',
      'Market',
      'Office',
      'PreferredContactInfo',
      'Website',
      'Address',
      'Address2',
      'City',
      'State',
      'Zipcode',
      'TaxID',
      'StateTaxID',
      'SOSFileNumber',
      'TaxReturnType',
      'AcquisitionType',
      'ContractStart',
      'ContractEnd',
      'Active',
      'ThirdPartyIdentifier'
    ];

    // Example row with sample data
    const exampleRow = [
      'SUNSET001',                    // PropertyCode
      'Sunset Ridge HOA',             // DisplayName
      'Sunset Ridge Homeowners Association', // LegalName
      dropdownMap['client-types']?.[0] || 'HOA', // ClientType
      dropdownMap['service-types']?.[0] || 'Full Service', // ServiceType
      dropdownMap['management-types']?.[0] || 'Portfolio', // ManagementType
      dropdownMap['development-stages']?.[0] || 'Homeowner Controlled', // DevelopmentStage
      dropdownMap['status']?.[0] || 'Active', // CommunityStatus
      '150',                          // BuiltOutUnits
      'Los Angeles',                  // Market
      'Main Office',                  // Office
      'manager@sunsetridge.com',      // PreferredContactInfo
      'https://sunsetridge.com',      // Website
      '123 Main Street',              // Address
      'Suite 100',                    // Address2
      'Los Angeles',                  // City
      'CA',                           // State
      '90001',                        // Zipcode
      '12-3456789',                   // TaxID
      'CA-123456',                    // StateTaxID
      'SOS-789012',                   // SOSFileNumber
      '1120',                         // TaxReturnType
      dropdownMap['acquisition-types']?.[0] || 'Organic', // AcquisitionType
      '01/01/2024',                   // ContractStart (MM/DD/YYYY format)
      '12/31/2025',                   // ContractEnd (MM/DD/YYYY format)
      'true',                         // Active
      'TP-001'                        // ThirdPartyIdentifier
    ];

    // Build CSV content
    let csvContent = '';
    
    // Instructions row
    csvContent += '# INSTRUCTIONS: Remove this example row before uploading. Required fields: PropertyCode OR (DisplayName AND LegalName). All other fields are optional but will be validated if provided.\n';
    csvContent += '# DATE FORMAT: Use MM/DD/YYYY format for dates (e.g., 01/15/2024) or YYYY-MM-DD (e.g., 2024-01-15).\n';
    
    // Headers
    csvContent += headers.join(',') + '\n';
    
    // Example row
    csvContent += exampleRow.map(val => {
      // Escape commas and quotes in CSV
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',') + '\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="communities-import-template.csv"');
    res.send(csvContent);
  } catch (error) {
    logger.databaseError('generate template', 'communities', error, 'BulkUploadController');
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
};

/**
 * Validate uploaded Communities CSV
 */
const validateCommunitiesCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = [];
    const errors = [];
    const duplicates = [];
    
    // Parse CSV - converts CSV rows to JavaScript objects (JSON-like)
    // Each row becomes an object: { PropertyCode: "SUNSET001", DisplayName: "...", etc. }
    const rows = await parseCSV(req.file.buffer);
    
    // Track duplicates WITHIN the uploaded CSV file
    const uploadedPcodes = new Map(); // row number -> PropertyCode
    const uploadedNamePairs = new Map(); // row number -> "DisplayName|LegalName"
    
    // First pass: collect all PropertyCodes and Name pairs from the upload
    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const hasPcode = row.PropertyCode && typeof row.PropertyCode === 'string' && row.PropertyCode.trim();
      const hasDisplayName = row.DisplayName && typeof row.DisplayName === 'string' && row.DisplayName.trim();
      const hasLegalName = row.LegalName && typeof row.LegalName === 'string' && row.LegalName.trim();
      
      if (hasPcode) {
        const pcodeUpper = row.PropertyCode.toUpperCase().trim();
        if (uploadedPcodes.has(pcodeUpper)) {
          // Found duplicate within upload
          const firstRow = uploadedPcodes.get(pcodeUpper);
          duplicates.push({
            row: firstRow,
            type: 'pcode',
            value: row.PropertyCode,
            field: 'PropertyCode',
            source: 'upload'
          });
          duplicates.push({
            row: rowNumber,
            type: 'pcode',
            value: row.PropertyCode,
            field: 'PropertyCode',
            source: 'upload'
          });
        } else {
          uploadedPcodes.set(pcodeUpper, rowNumber);
        }
      }
      
      if (hasDisplayName && hasLegalName) {
        const nameKey = `${row.DisplayName.toUpperCase().trim()}|${row.LegalName.toUpperCase().trim()}`;
        if (uploadedNamePairs.has(nameKey)) {
          // Found duplicate within upload
          const firstRow = uploadedNamePairs.get(nameKey);
          duplicates.push({
            row: firstRow,
            type: 'name',
            value: `${row.DisplayName} / ${row.LegalName}`,
            field: 'DisplayName/LegalName',
            source: 'upload'
          });
          duplicates.push({
            row: rowNumber,
            type: 'name',
            value: `${row.DisplayName} / ${row.LegalName}`,
            field: 'DisplayName/LegalName',
            source: 'upload'
          });
        } else {
          uploadedNamePairs.set(nameKey, rowNumber);
        }
      }
    });
    
    // Get existing communities for duplicate checking against database
    // Check both active and inactive communities to catch all duplicates
    const pool = await getConnection();
    const existingCommunities = await pool.request().query(`
      SELECT PropertyCode, DisplayName, LegalName, Active
      FROM dbo.cor_Communities
    `);
    
    const existingByPcode = new Set();
    const existingByNames = new Set();
    
    existingCommunities.recordset.forEach(comm => {
      if (comm.PropertyCode) {
        const normalized = comm.PropertyCode.toUpperCase().trim();
        existingByPcode.add(normalized);
      }
      if (comm.DisplayName && comm.LegalName) {
        const key = `${comm.DisplayName.toUpperCase().trim()}|${comm.LegalName.toUpperCase().trim()}`;
        existingByNames.add(key);
      }
    });

    // Get dropdown options for validation
    const dropdownOptions = await pool.request().query(`
      SELECT GroupID, ChoiceValue
      FROM dbo.cor_DynamicDropChoices
      WHERE GroupID IN ('client-types', 'service-types', 'management-types', 'development-stages', 'acquisition-types', 'status')
        AND IsActive = 1
    `);

    const validDropdowns = {
      'ClientType': new Set(),
      'ServiceType': new Set(),
      'ManagementType': new Set(),
      'DevelopmentStage': new Set(),
      'AcquisitionType': new Set(),
      'CommunityStatus': new Set()
    };

    dropdownOptions.recordset.forEach(row => {
      const fieldMap = {
        'client-types': 'ClientType',
        'service-types': 'ServiceType',
        'management-types': 'ManagementType',
        'development-stages': 'DevelopmentStage',
        'acquisition-types': 'AcquisitionType',
        'status': 'CommunityStatus'
      };
      const field = fieldMap[row.GroupID];
      if (field) {
        validDropdowns[field].add(row.ChoiceValue);
      }
    });

    // Validate each row
    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors = [];
      const rowWarnings = [];

      // Required field validation: PropertyCode OR (DisplayName AND LegalName)
      const hasPcode = row.PropertyCode && typeof row.PropertyCode === 'string' && row.PropertyCode.trim();
      const hasDisplayName = row.DisplayName && typeof row.DisplayName === 'string' && row.DisplayName.trim();
      const hasLegalName = row.LegalName && typeof row.LegalName === 'string' && row.LegalName.trim();

      if (!hasPcode && (!hasDisplayName || !hasLegalName)) {
        rowErrors.push('Either PropertyCode OR both DisplayName and LegalName are required');
      }

      // Check for duplicates against database (only if not already flagged as upload duplicate)
      const isUploadDuplicate = duplicates.some(d => d.row === rowNumber && d.source === 'upload');
      
      if (hasPcode && typeof row.PropertyCode === 'string' && !isUploadDuplicate) {
        const pcodeUpper = row.PropertyCode.toUpperCase().trim();
        if (existingByPcode.has(pcodeUpper)) {
          duplicates.push({
            row: rowNumber,
            type: 'pcode',
            value: row.PropertyCode,
            field: 'PropertyCode',
            source: 'database'
          });
          rowWarnings.push(`Duplicate PropertyCode: ${row.PropertyCode} (exists in database)`);
        }
      }

      if (hasDisplayName && hasLegalName && typeof row.DisplayName === 'string' && typeof row.LegalName === 'string' && !isUploadDuplicate) {
        const nameKey = `${row.DisplayName.toUpperCase().trim()}|${row.LegalName.toUpperCase().trim()}`;
        if (existingByNames.has(nameKey)) {
          duplicates.push({
            row: rowNumber,
            type: 'name',
            value: `${row.DisplayName} / ${row.LegalName}`,
            field: 'DisplayName/LegalName',
            source: 'database'
          });
          rowWarnings.push(`Duplicate combination: ${row.DisplayName} / ${row.LegalName} (exists in database)`);
        }
      }
      
      // Add warning for upload duplicates
      if (isUploadDuplicate) {
        const dupInfo = duplicates.find(d => d.row === rowNumber && d.source === 'upload');
        if (dupInfo) {
          rowWarnings.push(`Duplicate ${dupInfo.field} within upload: ${dupInfo.value}`);
        }
      }

      // Validate dropdown fields
      if (row.ClientType && !validDropdowns.ClientType.has(row.ClientType)) {
        rowErrors.push(`Invalid ClientType: ${row.ClientType}. Valid options: ${Array.from(validDropdowns.ClientType).join(', ')}`);
      }
      if (row.ServiceType && !validDropdowns.ServiceType.has(row.ServiceType)) {
        rowErrors.push(`Invalid ServiceType: ${row.ServiceType}`);
      }
      if (row.ManagementType && !validDropdowns.ManagementType.has(row.ManagementType)) {
        rowErrors.push(`Invalid ManagementType: ${row.ManagementType}`);
      }
      if (row.DevelopmentStage && !validDropdowns.DevelopmentStage.has(row.DevelopmentStage)) {
        rowErrors.push(`Invalid DevelopmentStage: ${row.DevelopmentStage}`);
      }
      if (row.AcquisitionType && !validDropdowns.AcquisitionType.has(row.AcquisitionType)) {
        rowErrors.push(`Invalid AcquisitionType: ${row.AcquisitionType}`);
      }
      if (row.CommunityStatus && !validDropdowns.CommunityStatus.has(row.CommunityStatus)) {
        rowErrors.push(`Invalid CommunityStatus: ${row.CommunityStatus}`);
      }

      // Validate data types
      if (row.BuiltOutUnits && isNaN(parseInt(row.BuiltOutUnits))) {
        rowErrors.push('BuiltOutUnits must be a number');
      }

      if (row.State && row.State.trim().length !== 2) {
        rowWarnings.push('State should be a 2-letter abbreviation (e.g., CA, NY)');
      }

      if (row.ContractStart) {
        // Remove quotes and trim whitespace that CSV parser might preserve
        const contractStart = String(row.ContractStart).replace(/^["']|["']$/g, '').trim();
        const dateValidation = validateAndNormalizeDate(contractStart);
        if (!dateValidation.valid) {
          rowErrors.push(`Invalid ContractStart date: ${contractStart}. ${dateValidation.error || 'Use MM/DD/YYYY or YYYY-MM-DD'}`);
        } else {
          // Normalize the date for later use
          row.ContractStart = dateValidation.normalized;
        }
      }

      if (row.ContractEnd) {
        // Remove quotes and trim whitespace that CSV parser might preserve
        const contractEnd = String(row.ContractEnd).replace(/^["']|["']$/g, '').trim();
        const dateValidation = validateAndNormalizeDate(contractEnd);
        if (!dateValidation.valid) {
          rowErrors.push(`Invalid ContractEnd date: ${contractEnd}. ${dateValidation.error || 'Use MM/DD/YYYY or YYYY-MM-DD'}`);
        } else {
          // Normalize the date for later use
          row.ContractEnd = dateValidation.normalized;
        }
      }

      if (row.Active && row.Active.toLowerCase() !== 'true' && row.Active.toLowerCase() !== 'false' && row.Active !== '1' && row.Active !== '0') {
        rowErrors.push('Active must be true/false or 1/0');
      }

      // Email format validation (if PreferredContactInfo looks like email)
      if (row.PreferredContactInfo && row.PreferredContactInfo.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.PreferredContactInfo)) {
          rowWarnings.push('PreferredContactInfo appears to be an email but format is invalid');
        }
      }

      results.push({
        row: rowNumber,
        data: row,
        status: rowErrors.length > 0 ? 'error' : rowWarnings.length > 0 ? 'warning' : 'valid',
        errors: rowErrors,
        warnings: rowWarnings
      });

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total: results.length,
        valid: results.filter(r => r.status === 'valid').length,
        warnings: results.filter(r => r.status === 'warning').length,
        errors: results.filter(r => r.status === 'error').length,
        results,
        duplicates,
        hasErrors: errors.length > 0,
        hasDuplicates: duplicates.length > 0
      }
    });
  } catch (error) {
    logger.databaseError('validate CSV', 'communities', error, 'BulkUploadController');
    logger.error('BulkUploadController - validateCommunitiesCSV error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to validate CSV',
      error: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Process Communities bulk import
 */
const processCommunitiesImport = async (req, res) => {
  try {
    const { rows, duplicateAction = 'skip' } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No rows to import'
      });
    }

    // Filter out rows with errors
    const validRows = rows.filter(r => r.status === 'valid' || r.status === 'warning');
    
    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows to import'
      });
    }

    const results = {
      total: validRows.length,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    const createdBy = req.user?.stakeholderId || null;
    const batchSize = 50;

    // Process in batches
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      
      try {
        for (const rowData of batch) {
          try {
            // Check for existing community (for update or skip logic)
            // Use case-insensitive comparison to match validation logic
            const pool = await getConnection();
            const existing = await pool.request()
              .input('PropertyCode', sql.NVarChar(50), rowData.data.PropertyCode || null)
              .input('DisplayName', sql.NVarChar(150), rowData.data.DisplayName || null)
              .input('LegalName', sql.NVarChar(200), rowData.data.LegalName || null)
              .query(`
                SELECT CommunityID
                FROM dbo.cor_Communities
                WHERE Active = 1
                  AND (
                    (PropertyCode IS NOT NULL AND UPPER(LTRIM(RTRIM(PropertyCode))) = UPPER(LTRIM(RTRIM(@PropertyCode))))
                    OR (UPPER(LTRIM(RTRIM(DisplayName))) = UPPER(LTRIM(RTRIM(@DisplayName))) 
                        AND UPPER(LTRIM(RTRIM(LegalName))) = UPPER(LTRIM(RTRIM(@LegalName))))
                  )
              `);

            const existingCommunity = existing.recordset.length > 0 ? existing.recordset[0] : null;

            // If duplicate exists and action is 'skip', skip it
            if (existingCommunity && duplicateAction === 'skip') {
              results.failed++;
              results.errors.push({
                row: rowData.row,
                error: 'Duplicate community found (skipped)'
              });
              continue;
            }

            // Prepare payload (same as createCommunity)
            const payload = {};
            const updatableFields = new Set([
              'PropertyCode', 'DisplayName', 'LegalName', 'ClientType', 'ServiceType',
              'ManagementType', 'DevelopmentStage', 'CommunityStatus', 'BuiltOutUnits',
              'Market', 'Office', 'PreferredContactInfo', 'Website', 'Address',
              'Address2', 'City', 'State', 'Zipcode', 'ContractStart', 'ContractEnd',
              'TaxID', 'StateTaxID', 'SOSFileNumber', 'TaxReturnType', 'AcquisitionType',
              'Active', 'ThirdPartyIdentifier'
            ]);

            Object.entries(rowData.data || {}).forEach(([key, value]) => {
              if (!updatableFields.has(key)) return;

              if (key === 'BuiltOutUnits') {
                payload[key] = value === '' || value === null || value === undefined ? null : parseInt(value);
              } else if (key === 'Active') {
                payload[key] = value === true || value === 'true' || value === 1 || value === '1';
              } else if (key === 'ContractStart' || key === 'ContractEnd') {
                // Dates should already be normalized from validation, but normalize again as safety
                if (value === '' || value === null || value === undefined) {
                  payload[key] = null;
                } else {
                  const dateValidation = validateAndNormalizeDate(value);
                  if (dateValidation.valid) {
                    payload[key] = dateValidation.normalized;
                  } else {
                    // If somehow an invalid date got through, set to null
                    payload[key] = null;
                  }
                }
              } else {
                payload[key] = value === '' ? null : value;
              }
            });

            // Create or update community
            if (existingCommunity) {
              await Community.update(existingCommunity.CommunityID, payload, createdBy);
              results.succeeded++;
            } else {
              await Community.create(payload, createdBy);
              results.succeeded++;
            }

          } catch (error) {
            results.failed++;
            const errorMessage = error.message || 'Unknown error occurred';
            results.errors.push({
              row: rowData.row,
              error: errorMessage
            });
            logger.error(`Import error on row ${rowData.row}:`, {
              error: error.message,
              stack: error.stack,
              rowData: rowData.data
            });
            // Stop on first error (fail fast)
            throw error;
          }
        }
      } catch (batchError) {
        logger.error('Batch import error:', {
          error: batchError.message,
          stack: batchError.stack,
          results: results,
          batchIndex: i,
          batchSize: batch.length
        });
        // Fail fast - stop processing
        return res.status(400).json({
          success: false,
          message: `Import stopped due to error: ${batchError.message}`,
          data: results,
          error: batchError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${results.succeeded} of ${results.total} communities`,
      data: results
    });
  } catch (error) {
    logger.error('Bulk import error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    logger.databaseError('bulk import', 'communities', error, 'BulkUploadController');
    res.status(500).json({
      success: false,
      message: `Failed to process import: ${error.message}`,
      error: error.message
    });
  }
};

// Helper functions
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    try {
      if (!buffer || buffer.length === 0) {
        return reject(new Error('Empty file or invalid buffer'));
      }

      const results = [];
      
      // Filter out comment lines before parsing
      let csvContent = buffer.toString('utf8');
      if (!csvContent || csvContent.trim().length === 0) {
        return reject(new Error('CSV file is empty'));
      }

      const lines = csvContent.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#');
      });
      csvContent = filteredLines.join('\n');
      
      if (!csvContent || csvContent.trim().length === 0) {
        return reject(new Error('CSV file contains only comments or empty lines'));
      }
      
      Readable.from(csvContent)
        .pipe(csv({
          skipEmptyLines: true,
          skipLinesWithError: false
        }))
        .on('data', (data) => {
          // Skip completely empty rows
          if (Object.values(data).every(v => !v || (typeof v === 'string' && v.trim() === ''))) {
            return;
          }
          results.push(data);
        })
        .on('end', () => resolve(results))
        .on('error', (err) => {
          reject(new Error(`CSV parsing error: ${err.message}`));
        });
    } catch (error) {
      reject(new Error(`Failed to parse CSV: ${error.message}`));
    }
  });
}

/**
 * Validates and normalizes date strings
 * Accepts: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY
 * Returns: { valid: boolean, normalized: string | null, error: string | null }
 */
function validateAndNormalizeDate(dateString) {
  if (!dateString) {
    return { valid: false, normalized: null, error: 'Date is required' };
  }

  // Convert to string and trim
  const trimmed = String(dateString).trim();
  
  // Try YYYY-MM-DD format (database format)
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoMatch = trimmed.match(isoRegex);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    
    // Validate ranges
    if (month < 1 || month > 12) {
      return { valid: false, normalized: null, error: 'Invalid month (must be 1-12)' };
    }
    if (day < 1 || day > 31) {
      return { valid: false, normalized: null, error: 'Invalid day (must be 1-31)' };
    }
    
    // Create date using local time to avoid timezone issues
    const date = new Date(year, month - 1, day);
    
    // Verify the date is valid and matches what we parsed
    if (date instanceof Date && !isNaN(date) && 
        date.getFullYear() === year && 
        date.getMonth() + 1 === month && 
        date.getDate() === day) {
      return { valid: true, normalized: trimmed, error: null };
    } else {
      return { valid: false, normalized: null, error: 'Invalid date (e.g., Feb 30 does not exist)' };
    }
  }

  // Try MM/DD/YYYY or MM-DD-YYYY format (human-friendly)
  const usRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = trimmed.match(usRegex);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Validate month and day ranges
    if (month < 1 || month > 12) {
      return { valid: false, normalized: null, error: 'Invalid month (must be 1-12)' };
    }
    if (day < 1 || day > 31) {
      return { valid: false, normalized: null, error: 'Invalid day (must be 1-31)' };
    }
    
    // Create date using local time to avoid timezone issues
    const date = new Date(year, month - 1, day);
    
    // Verify the date is valid and matches what we parsed (catches invalid dates like Feb 30)
    if (date instanceof Date && !isNaN(date) && 
        date.getFullYear() === year && 
        date.getMonth() + 1 === month && 
        date.getDate() === day) {
      // Create normalized date in YYYY-MM-DD format
      const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { valid: true, normalized, error: null };
    } else {
      return { valid: false, normalized: null, error: 'Invalid date (e.g., Feb 30 does not exist)' };
    }
  }

  return { valid: false, normalized: null, error: 'Invalid date format. Use MM/DD/YYYY or YYYY-MM-DD' };
}

module.exports = {
  generateCommunitiesTemplate,
  validateCommunitiesCSV,
  processCommunitiesImport
};

