const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

// Base community fields (no dropdowns)
const COMMUNITY_BASE_SELECT = `
  c.CommunityID,
  c.PropertyCode,
  c.DisplayName,
  c.LegalName,
  c.Active,
  c.ContractStart,
  c.ContractEnd,
  c.Address,
  c.Address2,
  c.City,
  c.State,
  c.Zipcode,
  c.ThirdPartyIdentifier,
  c.Market,
  c.Office,
  c.Website,
  c.TaxID,
  c.StateTaxID,
  c.SOSFileNumber,
  c.TaxReturnType,
  c.BuiltOutUnits,
  c.CommunityStatus,
  c.PreferredContactInfo,
  c.CreatedOn,
  c.CreatedBy,
  c.ModifiedOn,
  c.ModifiedBy,
  -- CreatedBy stakeholder name (handle nulls)
  CASE 
    WHEN CreatedByStakeholder.FirstName IS NOT NULL AND CreatedByStakeholder.LastName IS NOT NULL 
    THEN CreatedByStakeholder.FirstName + ' ' + CreatedByStakeholder.LastName
    WHEN CreatedByStakeholder.FirstName IS NOT NULL 
    THEN CreatedByStakeholder.FirstName
    WHEN CreatedByStakeholder.LastName IS NOT NULL 
    THEN CreatedByStakeholder.LastName
    ELSE NULL
  END AS CreatedByName,
  -- ModifiedBy stakeholder name (handle nulls)
  CASE 
    WHEN ModifiedByStakeholder.FirstName IS NOT NULL AND ModifiedByStakeholder.LastName IS NOT NULL 
    THEN ModifiedByStakeholder.FirstName + ' ' + ModifiedByStakeholder.LastName
    WHEN ModifiedByStakeholder.FirstName IS NOT NULL 
    THEN ModifiedByStakeholder.FirstName
    WHEN ModifiedByStakeholder.LastName IS NOT NULL 
    THEN ModifiedByStakeholder.LastName
    ELSE NULL
  END AS ModifiedByName
`;

// Dropdown fields joined from cor_DynamicDropChoices
const COMMUNITY_DROPDOWN_SELECT = `
  ClientType.ChoiceValue AS ClientType,
  ServiceType.ChoiceValue AS ServiceType,
  ManagementType.ChoiceValue AS ManagementType,
  DevelopmentStage.ChoiceValue AS DevelopmentStage,
  AcquisitionType.ChoiceValue AS AcquisitionType
`;

// Full SELECT with joins
const COMMUNITY_SELECT = `
  ${COMMUNITY_BASE_SELECT},
  ${COMMUNITY_DROPDOWN_SELECT}
`;

const COMMUNITY_FROM_JOINS = `
  FROM dbo.cor_Communities c
  LEFT JOIN dbo.cor_DynamicDropChoices ClientType 
    ON c.ClientTypeID = ClientType.ChoiceID 
    AND ClientType.GroupID = 'client-types'
    AND ClientType.IsActive = 1
  LEFT JOIN dbo.cor_DynamicDropChoices ServiceType 
    ON c.ServiceTypeID = ServiceType.ChoiceID 
    AND ServiceType.GroupID = 'service-types'
    AND ServiceType.IsActive = 1
  LEFT JOIN dbo.cor_DynamicDropChoices ManagementType 
    ON c.ManagementTypeID = ManagementType.ChoiceID 
    AND ManagementType.GroupID = 'management-types'
    AND ManagementType.IsActive = 1
  LEFT JOIN dbo.cor_DynamicDropChoices DevelopmentStage 
    ON c.DevelopmentStageID = DevelopmentStage.ChoiceID 
    AND DevelopmentStage.GroupID = 'development-stages'
    AND DevelopmentStage.IsActive = 1
  LEFT JOIN dbo.cor_DynamicDropChoices AcquisitionType 
    ON c.AcquisitionTypeID = AcquisitionType.ChoiceID 
    AND AcquisitionType.GroupID = 'acquisition-types'
    AND AcquisitionType.IsActive = 1
  LEFT JOIN dbo.cor_Stakeholders CreatedByStakeholder 
    ON c.CreatedBy = CreatedByStakeholder.StakeholderID 
    AND CreatedByStakeholder.IsActive = 1
  LEFT JOIN dbo.cor_Stakeholders ModifiedByStakeholder 
    ON c.ModifiedBy = ModifiedByStakeholder.StakeholderID 
    AND ModifiedByStakeholder.IsActive = 1
`;

class Community {
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT ${COMMUNITY_SELECT}
        ${COMMUNITY_FROM_JOINS}
        ORDER BY c.DisplayName
      `);
      return result.recordset;
    } catch (error) {
      // Enhanced error logging
      logger.error('Community.getAll() error:', {
        message: error.message,
        code: error.code,
        number: error.number,
        state: error.state,
        class: error.class,
        serverName: error.serverName,
        procName: error.procName,
        lineNumber: error.lineNumber
      });
      throw new Error(`Error fetching communities: ${error.message}`);
    }
  }

  static async getById(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT ${COMMUNITY_SELECT}
          ${COMMUNITY_FROM_JOINS}
          WHERE c.CommunityID = @communityId
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching community: ${error.message}`);
    }
  }

  static async create(payload, createdBy = null) {
    const pool = await getConnection();
    const request = pool.request();

    // Dropdown fields that need to be converted from text (ChoiceValue) to GUID (ChoiceID)
    const dropdownFields = {
      'ClientType': 'ClientTypeID',
      'ServiceType': 'ServiceTypeID',
      'ManagementType': 'ManagementTypeID',
      'DevelopmentStage': 'DevelopmentStageID',
      'AcquisitionType': 'AcquisitionTypeID'
    };

    // Regular text/number fields
    const fieldConfig = {
      PropertyCode: { type: sql.NVarChar(50) },
      DisplayName: { type: sql.NVarChar(150) },
      LegalName: { type: sql.NVarChar(200) },
      CommunityStatus: { type: sql.NVarChar(100) },
      BuiltOutUnits: { type: sql.Int },
      Market: { type: sql.NVarChar(100) },
      Office: { type: sql.NVarChar(100) },
      PreferredContactInfo: { type: sql.NVarChar(200) },
      Website: { type: sql.NVarChar(200) },
      Address: { type: sql.NVarChar(200) },
      Address2: { type: sql.NVarChar(200) },
      City: { type: sql.NVarChar(100) },
      State: { type: sql.NVarChar(50) },
      Zipcode: { type: sql.NVarChar(20) },
      ContractStart: { type: sql.Date },
      ContractEnd: { type: sql.Date },
      TaxID: { type: sql.NVarChar(30) },
      StateTaxID: { type: sql.NVarChar(30) },
      SOSFileNumber: { type: sql.NVarChar(30) },
      TaxReturnType: { type: sql.NVarChar(50) },
      Active: { type: sql.Bit },
      ThirdPartyIdentifier: { type: sql.NVarChar(100) }
    };

    const insertFields = [];
    const insertValues = [];

    // Map dropdown fields to their GroupIDs
    const dropdownGroupMap = {
      'ClientType': 'client-types',
      'ServiceType': 'service-types',
      'ManagementType': 'management-types',
      'DevelopmentStage': 'development-stages',
      'AcquisitionType': 'acquisition-types'
    };

    // Process dropdown fields first (convert text to GUID)
    for (const [textField, guidField] of Object.entries(dropdownFields)) {
      if (payload[textField] !== undefined && payload[textField] !== null && payload[textField] !== '') {
        // Look up the GUID from cor_DynamicDropChoices using GroupID
        const lookupRequest = pool.request();
        lookupRequest.input('ChoiceValue', sql.VarChar(150), payload[textField]);
        lookupRequest.input('GroupID', sql.VarChar(100), dropdownGroupMap[textField]);
        
        const lookupResult = await lookupRequest.query(`
          SELECT ChoiceID
          FROM dbo.cor_DynamicDropChoices
          WHERE GroupID = @GroupID
            AND ChoiceValue = @ChoiceValue
            AND IsActive = 1
        `);

        if (lookupResult.recordset.length > 0) {
          const choiceId = lookupResult.recordset[0].ChoiceID;
          request.input(guidField, sql.UniqueIdentifier, choiceId);
          insertFields.push(guidField);
          insertValues.push(`@${guidField}`);
        } else {
          // Choice not found - set to NULL
          insertFields.push(guidField);
          insertValues.push('NULL');
        }
      } else {
        // Set to NULL if not provided
        insertFields.push(guidField);
        insertValues.push('NULL');
      }
    }

    // Process CreatedBy
    if (createdBy) {
      request.input('CreatedBy', sql.UniqueIdentifier, createdBy);
      insertFields.push('CreatedBy');
      insertValues.push('@CreatedBy');
    }

    // Process regular fields
    Object.entries(payload).forEach(([key, value]) => {
      // Skip dropdown fields (already processed above)
      if (dropdownFields[key]) return;

      const config = fieldConfig[key];
      if (!config) return;

      if (key === 'BuiltOutUnits') {
        if (value === '' || value === null || value === undefined) {
          insertFields.push(key);
          insertValues.push('NULL');
        } else {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            request.input(key, config.type, parsed);
            insertFields.push(key);
            insertValues.push(`@${key}`);
          } else {
            insertFields.push(key);
            insertValues.push('NULL');
          }
        }
      } else if (key === 'Active') {
        request.input(key, config.type, value);
        insertFields.push(key);
        insertValues.push(`@${key}`);
      } else if (key === 'ContractStart' || key === 'ContractEnd') {
        if (value === '' || value === null || value === undefined) {
          insertFields.push(key);
          insertValues.push('NULL');
        } else {
          request.input(key, config.type, value);
          insertFields.push(key);
          insertValues.push(`@${key}`);
        }
      } else {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        if (trimmedValue === '' || trimmedValue === null || trimmedValue === undefined) {
          insertFields.push(key);
          insertValues.push('NULL');
        } else {
          request.input(key, config.type, trimmedValue);
          insertFields.push(key);
          insertValues.push(`@${key}`);
        }
      }
    });

    // Add default fields
    insertFields.push('CreatedOn');
    insertValues.push('SYSUTCDATETIME()');

    const result = await request.query(`
      INSERT INTO dbo.cor_Communities (${insertFields.join(', ')})
      OUTPUT INSERTED.CommunityID
      VALUES (${insertValues.join(', ')})
    `);

    const newCommunityId = result.recordset[0].CommunityID;
    return this.getById(newCommunityId);
  }

  static async update(communityId, payload) {
    if (!payload || Object.keys(payload).length === 0) {
      return this.getById(communityId);
    }

    const pool = await getConnection();
    const request = pool.request().input('communityId', sql.UniqueIdentifier, communityId);

    // Dropdown fields that need to be converted from text (ChoiceValue) to GUID (ChoiceID)
    const dropdownFields = {
      'ClientType': 'ClientTypeID',
      'ServiceType': 'ServiceTypeID',
      'ManagementType': 'ManagementTypeID',
      'DevelopmentStage': 'DevelopmentStageID',
      'AcquisitionType': 'AcquisitionTypeID'
    };

    // Regular text/number fields
    const fieldConfig = {
      PropertyCode: { type: sql.NVarChar(50) },
      DisplayName: { type: sql.NVarChar(150) },
      LegalName: { type: sql.NVarChar(200) },
      CommunityStatus: { type: sql.NVarChar(100) },
      BuiltOutUnits: { type: sql.Int },
      Market: { type: sql.NVarChar(100) },
      Office: { type: sql.NVarChar(100) },
      PreferredContactInfo: { type: sql.NVarChar(200) },
      Website: { type: sql.NVarChar(200) },
      Address: { type: sql.NVarChar(200) },
      Address2: { type: sql.NVarChar(200) },
      City: { type: sql.NVarChar(100) },
      State: { type: sql.NVarChar(50) },
      Zipcode: { type: sql.NVarChar(20) },
      ContractStart: { type: sql.Date },
      ContractEnd: { type: sql.Date },
      TaxID: { type: sql.NVarChar(30) },
      StateTaxID: { type: sql.NVarChar(30) },
      SOSFileNumber: { type: sql.NVarChar(30) },
      TaxReturnType: { type: sql.NVarChar(50) },
      Active: { type: sql.Bit },
      ThirdPartyIdentifier: { type: sql.NVarChar(100) }
    };

    const setClauses = [];

    // Map dropdown fields to their GroupIDs
    const dropdownGroupMap = {
      'ClientType': 'client-types',
      'ServiceType': 'service-types',
      'ManagementType': 'management-types',
      'DevelopmentStage': 'development-stages',
      'AcquisitionType': 'acquisition-types'
    };

    // Process dropdown fields first (convert text to GUID)
    for (const [textField, guidField] of Object.entries(dropdownFields)) {
      if (payload[textField] !== undefined && payload[textField] !== null && payload[textField] !== '') {
        // Look up the GUID from cor_DynamicDropChoices using GroupID
        const lookupRequest = pool.request();
        lookupRequest.input('ChoiceValue', sql.VarChar(150), payload[textField]);
        lookupRequest.input('GroupID', sql.VarChar(100), dropdownGroupMap[textField]);
        
        const lookupResult = await lookupRequest.query(`
          SELECT ChoiceID
          FROM dbo.cor_DynamicDropChoices
          WHERE GroupID = @GroupID
            AND ChoiceValue = @ChoiceValue
            AND IsActive = 1
        `);

        if (lookupResult.recordset.length > 0) {
          const choiceId = lookupResult.recordset[0].ChoiceID;
          request.input(guidField, sql.UniqueIdentifier, choiceId);
          setClauses.push(`${guidField} = @${guidField}`);
        } else {
          // Choice not found - set to NULL or skip?
          // For now, we'll set to NULL if the value doesn't exist
          request.input(guidField, sql.UniqueIdentifier, null);
          setClauses.push(`${guidField} = NULL`);
        }
      } else if (payload[textField] === null || payload[textField] === '') {
        // Explicitly set to NULL if empty string or null
        setClauses.push(`${guidField} = NULL`);
      }
    }

    // Process ModifiedBy separately (GUID field)
    if (payload.ModifiedBy !== undefined) {
      if (payload.ModifiedBy === null || payload.ModifiedBy === '') {
        setClauses.push('ModifiedBy = NULL');
      } else {
        request.input('ModifiedBy', sql.UniqueIdentifier, payload.ModifiedBy);
        setClauses.push('ModifiedBy = @ModifiedBy');
      }
    }

    // Process regular fields
    Object.entries(payload).forEach(([key, value]) => {
      // Skip dropdown fields and ModifiedBy (already processed above)
      if (dropdownFields[key] || key === 'ModifiedBy') return;

      const config = fieldConfig[key];
      if (!config) return;

      if (key === 'BuiltOutUnits') {
        if (value === '' || value === null || value === undefined) {
          request.input(key, config.type, null);
          setClauses.push(`${key} = NULL`);
        } else {
          const parsed = Number(value);
          request.input(key, config.type, Number.isNaN(parsed) ? null : parsed);
          setClauses.push(`${key} = @${key}`);
        }
      } else if (key === 'Active') {
        // Ensure Active is a boolean (handle string "true"/"false", "1"/"0", etc.)
        let activeValue = value;
        if (typeof value === 'string') {
          activeValue = value === 'true' || value === '1';
        } else if (value === 1 || value === '1') {
          activeValue = true;
        } else if (value === 0 || value === '0' || value === false || value === 'false') {
          activeValue = false;
        }
        request.input(key, config.type, activeValue);
        setClauses.push(`${key} = @${key}`);
      } else if (key === 'ContractStart' || key === 'ContractEnd') {
        if (value === '' || value === null || value === undefined) {
          setClauses.push(`${key} = NULL`);
        } else {
          request.input(key, config.type, value);
          setClauses.push(`${key} = @${key}`);
        }
      } else {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        if (trimmedValue === '' || trimmedValue === null || trimmedValue === undefined) {
          setClauses.push(`${key} = NULL`);
        } else {
          request.input(key, config.type, trimmedValue);
          setClauses.push(`${key} = @${key}`);
        }
      }
    });

    if (setClauses.length === 0) {
      return this.getById(communityId);
    }

    setClauses.push('ModifiedOn = SYSUTCDATETIME()');

    try {
      await request.query(`
        UPDATE dbo.cor_Communities
        SET ${setClauses.join(', ')}
        WHERE CommunityID = @communityId
      `);
    } catch (sqlError) {
      // Enhanced error logging for SQL errors
      logger.error('SQL Error in Community.update:', {
        message: sqlError.message,
        code: sqlError.code,
        number: sqlError.number,
        state: sqlError.state,
        setClauses: setClauses,
        payload: payload
      });
      const errorMessage = sqlError.message || 'Database error occurred';
      const enhancedError = new Error(`Failed to update community: ${errorMessage}`);
      enhancedError.code = sqlError.code;
      enhancedError.number = sqlError.number;
      enhancedError.state = sqlError.state;
      throw enhancedError;
    }

    return this.getById(communityId);
  }
}

module.exports = Community;