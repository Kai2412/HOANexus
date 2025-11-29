const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

// Base billing information fields
const BILLING_INFO_BASE_SELECT = `
  bi.BillingInformationID,
  bi.CommunityID,
  bi.BillingMonth,
  bi.BillingDay,
  bi.Coupon,
  bi.CreatedOn,
  bi.CreatedBy,
  bi.ModifiedOn,
  bi.ModifiedBy,
  bi.IsActive
`;

// Dropdown fields joined from cor_DynamicDropChoices
const BILLING_INFO_DROPDOWN_SELECT = `
  BillingFrequency.ChoiceValue AS BillingFrequency,
  NoticeRequirement.ChoiceValue AS NoticeRequirement
`;

// Full SELECT with joins
const BILLING_INFO_SELECT = `
  ${BILLING_INFO_BASE_SELECT},
  ${BILLING_INFO_DROPDOWN_SELECT}
`;

const BILLING_INFO_FROM_JOINS = `
  FROM dbo.cor_BillingInformation bi
  LEFT JOIN dbo.cor_DynamicDropChoices BillingFrequency 
    ON bi.BillingFrequencyID = BillingFrequency.ChoiceID 
    AND BillingFrequency.GroupID = 'billing-frequency'
    AND BillingFrequency.IsActive = 1
  LEFT JOIN dbo.cor_DynamicDropChoices NoticeRequirement 
    ON bi.NoticeRequirementID = NoticeRequirement.ChoiceID 
    AND NoticeRequirement.GroupID = 'notice-requirements'
    AND NoticeRequirement.IsActive = 1
`;

class BillingInformation {
  // Get billing information by community ID
  static async getByCommunity(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT ${BILLING_INFO_SELECT}
          ${BILLING_INFO_FROM_JOINS}
          WHERE bi.CommunityID = @communityId 
            AND bi.IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'billing information by community', error, 'BillingInformationModel');
      throw new Error('Error fetching billing information: ' + error.message);
    }
  }

  // Get billing information by ID
  static async getById(billingInformationId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('billingInformationId', sql.UniqueIdentifier, billingInformationId)
        .query(`
          SELECT ${BILLING_INFO_SELECT}
          ${BILLING_INFO_FROM_JOINS}
          WHERE bi.BillingInformationID = @billingInformationId 
            AND bi.IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'billing information by ID', error, 'BillingInformationModel');
      throw new Error('Error fetching billing information: ' + error.message);
    }
  }

  // Create new billing information
  static async create(payload, createdBy = null) {
    const pool = await getConnection();
    const request = pool.request();

    // Dropdown fields that need to be converted from text (ChoiceValue) to GUID (ChoiceID)
    const dropdownFields = {
      'BillingFrequency': 'BillingFrequencyID',
      'NoticeRequirement': 'NoticeRequirementID'
    };

    // Regular fields
    const fieldConfig = {
      CommunityID: { type: sql.UniqueIdentifier, required: true },
      BillingMonth: { type: sql.Int },
      BillingDay: { type: sql.Int },
      Coupon: { type: sql.Bit }
    };

    // Handle dropdown fields - convert ChoiceValue to ChoiceID
    for (const [frontendKey, dbKey] of Object.entries(dropdownFields)) {
      if (payload[frontendKey]) {
        const choiceValue = payload[frontendKey];
        const groupId = frontendKey === 'BillingFrequency' ? 'billing-frequency' : 'notice-requirements';
        
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
      INSERT INTO dbo.cor_BillingInformation (${fields.join(', ')})
      OUTPUT INSERTED.BillingInformationID
      VALUES (${values.join(', ')})
    `);

    const newId = result.recordset[0].BillingInformationID;
    return await this.getById(newId);
  }

  // Update billing information
  static async update(id, payload, modifiedBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Dropdown fields mapping
      const dropdownFields = {
        'BillingFrequency': 'BillingFrequencyID',
        'NoticeRequirement': 'NoticeRequirementID'
      };

      // Handle dropdown fields - convert ChoiceValue to ChoiceID
      for (const [frontendKey, dbKey] of Object.entries(dropdownFields)) {
        if (payload[frontendKey] !== undefined) {
          const choiceValue = payload[frontendKey];
          const groupId = frontendKey === 'BillingFrequency' ? 'billing-frequency' : 'notice-requirements';
          
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
        BillingMonth: sql.Int,
        BillingDay: sql.Int,
        Coupon: sql.Bit
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
        UPDATE dbo.cor_BillingInformation 
        SET ${updates.join(', ')}
        WHERE BillingInformationID = @id AND IsActive = 1
      `);

      return await this.getById(id);
    } catch (error) {
      logger.databaseError('update', 'billing information', error, 'BillingInformationModel');
      throw new Error('Error updating billing information: ' + error.message);
    }
  }
}

module.exports = BillingInformation;

