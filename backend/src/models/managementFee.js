const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

// Base management fee fields
const MANAGEMENT_FEE_BASE_SELECT = `
  mf.ManagementFeesID,
  mf.CommunityID,
  mf.ManagementFee,
  mf.PerUnitFee,
  mf.IncreaseType,
  mf.IncreaseEffective,
  mf.BoardApprovalRequired,
  mf.AutoIncrease,
  mf.FixedCost,
  mf.CreatedOn,
  mf.CreatedBy,
  mf.ModifiedOn,
  mf.ModifiedBy,
  mf.IsActive
`;

// Dropdown fields joined from cor_DynamicDropChoices
const MANAGEMENT_FEE_DROPDOWN_SELECT = `
  FeeType.ChoiceValue AS FeeType
`;

// Full SELECT with joins
const MANAGEMENT_FEE_SELECT = `
  ${MANAGEMENT_FEE_BASE_SELECT},
  ${MANAGEMENT_FEE_DROPDOWN_SELECT}
`;

const MANAGEMENT_FEE_FROM_JOINS = `
  FROM dbo.cor_ManagementFees mf
  LEFT JOIN dbo.cor_DynamicDropChoices FeeType 
    ON mf.FeeTypeID = FeeType.ChoiceID 
    AND FeeType.GroupID = 'fee-types'
    AND FeeType.IsActive = 1
`;

class ManagementFee {
  // Get management fee by community ID
  static async getByCommunity(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT ${MANAGEMENT_FEE_SELECT}
          ${MANAGEMENT_FEE_FROM_JOINS}
          WHERE mf.CommunityID = @communityId 
            AND mf.IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'management fee by community', error, 'ManagementFeeModel');
      throw new Error('Error fetching management fee: ' + error.message);
    }
  }

  // Get management fee by ID
  static async getById(managementFeeId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('managementFeeId', sql.UniqueIdentifier, managementFeeId)
        .query(`
          SELECT ${MANAGEMENT_FEE_SELECT}
          ${MANAGEMENT_FEE_FROM_JOINS}
          WHERE mf.ManagementFeesID = @managementFeeId 
            AND mf.IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'management fee by ID', error, 'ManagementFeeModel');
      throw new Error('Error fetching management fee: ' + error.message);
    }
  }

  // Create new management fee
  static async create(payload, createdBy = null) {
    const pool = await getConnection();
    const request = pool.request();

    // Dropdown fields that need to be converted from text (ChoiceValue) to GUID (ChoiceID)
    const dropdownFields = {
      'FeeType': 'FeeTypeID'
    };

    // Regular fields
    const fieldConfig = {
      CommunityID: { type: sql.UniqueIdentifier, required: true },
      ManagementFee: { type: sql.Decimal(12, 2) },
      PerUnitFee: { type: sql.Decimal(12, 2) },
      IncreaseType: { type: sql.NVarChar(50) },
      IncreaseEffective: { type: sql.Date },
      BoardApprovalRequired: { type: sql.Bit },
      AutoIncrease: { type: sql.NVarChar(50) },
      FixedCost: { type: sql.Decimal(12, 2) }
    };

    // Handle dropdown fields - convert ChoiceValue to ChoiceID
    for (const [frontendKey, dbKey] of Object.entries(dropdownFields)) {
      if (payload[frontendKey]) {
        const choiceValue = payload[frontendKey];
        const groupId = 'fee-types';
        
        // Look up the ChoiceID for this ChoiceValue
        const choiceResult = await pool.request()
          .input('groupId', sql.VarChar(100), groupId)
          .input('choiceValue', sql.VarChar(150), choiceValue)
          .query(`
            SELECT ChoiceID 
            FROM dbo.cor_DynamicDropChoices 
            WHERE GroupID = @groupId 
              AND ChoiceValue = @choiceValue 
              AND IsActive = 1
          `);
        
        if (choiceResult.recordset.length > 0) {
          payload[dbKey] = choiceResult.recordset[0].ChoiceID;
        } else {
          throw new Error(`Invalid ${frontendKey}: ${choiceValue} not found in dropdown choices`);
        }
        delete payload[frontendKey];
      }
    }

    // Build INSERT statement
    const fields = ['CommunityID', 'CreatedBy'];
    const values = ['@CommunityID', '@CreatedBy'];
    const inputs = [];

    // Add regular fields
    for (const [key, config] of Object.entries(fieldConfig)) {
      if (key === 'CommunityID' || key === 'CreatedBy') continue;
      
      if (payload[key] !== undefined && payload[key] !== null) {
        fields.push(key);
        values.push(`@${key}`);
        inputs.push({ name: key, type: config.type, value: payload[key] });
      }
    }

    // Add dropdown fields
    for (const [frontendKey, dbKey] of Object.entries(dropdownFields)) {
      if (payload[dbKey] !== undefined) {
        fields.push(dbKey);
        values.push(`@${dbKey}`);
        inputs.push({ name: dbKey, type: sql.UniqueIdentifier, value: payload[dbKey] });
      }
    }

    // Add inputs
    request.input('CommunityID', sql.UniqueIdentifier, payload.CommunityID);
    request.input('CreatedBy', sql.UniqueIdentifier, createdBy);
    
    for (const input of inputs) {
      request.input(input.name, input.type, input.value);
    }

    const result = await request.query(`
      INSERT INTO dbo.cor_ManagementFees (${fields.join(', ')})
      OUTPUT INSERTED.ManagementFeesID
      VALUES (${values.join(', ')})
    `);

    const newId = result.recordset[0].ManagementFeesID;
    return await this.getById(newId);
  }

  // Update management fee
  static async update(id, payload, modifiedBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Dropdown fields mapping
      const dropdownFields = {
        'FeeType': 'FeeTypeID'
      };

      // Handle dropdown fields - convert ChoiceValue to ChoiceID
      for (const [frontendKey, dbKey] of Object.entries(dropdownFields)) {
        if (payload[frontendKey] !== undefined) {
          const choiceValue = payload[frontendKey];
          const groupId = 'fee-types';
          
          if (choiceValue === null || choiceValue === '') {
            payload[dbKey] = null;
          } else {
            // Look up the ChoiceID for this ChoiceValue
            const choiceResult = await pool.request()
              .input('groupId', sql.VarChar(100), groupId)
              .input('choiceValue', sql.VarChar(150), choiceValue)
              .query(`
                SELECT ChoiceID 
                FROM dbo.cor_DynamicDropChoices 
                WHERE GroupID = @groupId 
                  AND ChoiceValue = @choiceValue 
                  AND IsActive = 1
              `);
            
            if (choiceResult.recordset.length > 0) {
              payload[dbKey] = choiceResult.recordset[0].ChoiceID;
            } else {
              throw new Error(`Invalid ${frontendKey}: ${choiceValue} not found in dropdown choices`);
            }
          }
          delete payload[frontendKey];
        }
      }

      // Build UPDATE statement
      const updates = [];
      request.input('id', sql.UniqueIdentifier, id);
      request.input('ModifiedBy', sql.UniqueIdentifier, modifiedBy);

      // Regular fields
      const fieldConfig = {
        ManagementFee: sql.Decimal(12, 2),
        PerUnitFee: sql.Decimal(12, 2),
        IncreaseType: sql.NVarChar(50),
        IncreaseEffective: sql.Date,
        BoardApprovalRequired: sql.Bit,
        AutoIncrease: sql.NVarChar(50),
        FixedCost: sql.Decimal(12, 2)
      };

      for (const [key, sqlType] of Object.entries(fieldConfig)) {
        if (payload[key] !== undefined) {
          updates.push(`${key} = @${key}`);
          request.input(key, sqlType, payload[key]);
        }
      }

      // Dropdown fields
      for (const [frontendKey, dbKey] of Object.entries(dropdownFields)) {
        if (payload[dbKey] !== undefined) {
          updates.push(`${dbKey} = @${dbKey}`);
          request.input(dbKey, sql.UniqueIdentifier, payload[dbKey]);
        }
      }

      if (updates.length === 0) {
        return await this.getById(id);
      }

      updates.push('ModifiedOn = SYSUTCDATETIME()');
      updates.push('ModifiedBy = @ModifiedBy');

      await request.query(`
        UPDATE dbo.cor_ManagementFees 
        SET ${updates.join(', ')}
        WHERE ManagementFeesID = @id AND IsActive = 1
      `);

      return await this.getById(id);
    } catch (error) {
      logger.databaseError('update', 'management fee', error, 'ManagementFeeModel');
      throw new Error('Error updating management fee: ' + error.message);
    }
  }
}

module.exports = ManagementFee;

