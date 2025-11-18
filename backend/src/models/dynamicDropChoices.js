const { sql, getConnection } = require('../config/database');

class DynamicDropChoices {
  static async getByGroup(groupId, includeInactive = false) {
    const pool = await getConnection();
    const request = pool.request()
      .input('groupId', sql.VarChar(100), groupId);

    let query = `
      SELECT
        ChoiceID,
        GroupID,
        ChoiceValue,
        DisplayOrder,
        IsDefault,
        IsActive,
        IsSystemManaged,
        CreatedOn,
        CreatedBy,
        ModifiedOn,
        ModifiedBy
      FROM dbo.cor_DynamicDropChoices
      WHERE GroupID = @groupId
    `;

    if (!includeInactive) {
      query += ` AND IsActive = 1`;
    }

    query += ` ORDER BY DisplayOrder, ChoiceValue`;

    const result = await request.query(query);
    return result.recordset;
  }

  // Legacy method for backward compatibility (maps to getByGroup)
  static async getByColumn(tableName, columnName, includeInactive = false) {
    // Map old table/column to new group IDs
    const groupMapping = {
      'cor_Communities': {
        'ClientType': 'client-types',
        'ServiceType': 'service-types',
        'ManagementType': 'management-types',
        'DevelopmentStage': 'development-stages',
        'AcquisitionType': 'acquisition-types'
      },
      'cor_Stakeholders': {
        'Type': 'stakeholder-types',
        'SubType': 'stakeholder-subtypes', // Will need parent type to determine exact group
        'AccessLevel': 'access-levels',
        'PreferredContactMethod': 'preferred-contact-methods',
        'Status': 'status'
      }
    };

    const groupId = groupMapping[tableName]?.[columnName];
    if (!groupId) {
      throw new Error(`No GroupID mapping found for ${tableName}.${columnName}`);
    }

    return this.getByGroup(groupId, includeInactive);
  }

  static async getById(choiceId) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('choiceId', sql.UniqueIdentifier, choiceId)
      .query(`
        SELECT
          ChoiceID,
          GroupID,
          ChoiceValue,
          DisplayOrder,
          IsDefault,
          IsActive,
          IsSystemManaged,
          CreatedOn,
          CreatedBy,
          ModifiedOn,
          ModifiedBy
        FROM dbo.cor_DynamicDropChoices
        WHERE ChoiceID = @choiceId
      `);

    return result.recordset[0];
  }

  static async create(data) {
    const pool = await getConnection();
    const choiceId = data.choiceId || require('crypto').randomUUID();
    const request = pool.request()
      .input('choiceId', sql.UniqueIdentifier, choiceId)
      .input('groupId', sql.VarChar(100), data.groupId)
      .input('choiceValue', sql.VarChar(150), data.choiceValue)
      .input('displayOrder', sql.Int, data.displayOrder)
      .input('isDefault', sql.Bit, data.isDefault || false)
      .input('isActive', sql.Bit, data.isActive !== undefined ? data.isActive : true);

    let createdByInput = '';
    let createdByValue = '';
    if (data.createdBy) {
      request.input('createdBy', sql.UniqueIdentifier, data.createdBy);
      createdByInput = ', CreatedBy';
      createdByValue = ', @createdBy';
    }

    const isSystemManaged = data.isSystemManaged !== undefined ? data.isSystemManaged : false;
    request.input('isSystemManaged', sql.Bit, isSystemManaged);

    const result = await request.query(`
      INSERT INTO dbo.cor_DynamicDropChoices
        (ChoiceID, GroupID, ChoiceValue, DisplayOrder, IsDefault, IsActive, IsSystemManaged, CreatedOn${createdByInput})
      VALUES
        (@choiceId, @groupId, @choiceValue, @displayOrder, @isDefault, @isActive, @isSystemManaged, SYSUTCDATETIME()${createdByValue})
      SELECT
        ChoiceID,
        GroupID,
        ChoiceValue,
        DisplayOrder,
        IsDefault,
        IsActive,
        IsSystemManaged,
        CreatedOn,
        CreatedBy,
        ModifiedOn,
        ModifiedBy
      FROM dbo.cor_DynamicDropChoices
      WHERE ChoiceID = @choiceId
    `);

    return result.recordset[0];
  }

  static async update(choiceId, data) {
    const pool = await getConnection();
    const request = pool.request()
      .input('choiceId', sql.UniqueIdentifier, choiceId);

    const updates = [];
    
    if (data.choiceValue !== undefined) {
      request.input('choiceValue', sql.VarChar(150), data.choiceValue);
      updates.push('ChoiceValue = @choiceValue');
    }
    
    if (data.displayOrder !== undefined) {
      request.input('displayOrder', sql.Int, data.displayOrder);
      updates.push('DisplayOrder = @displayOrder');
    }
    
    if (data.isDefault !== undefined) {
      request.input('isDefault', sql.Bit, data.isDefault);
      updates.push('IsDefault = @isDefault');
    }
    
    if (data.isActive !== undefined) {
      request.input('isActive', sql.Bit, data.isActive);
      updates.push('IsActive = @isActive');
    }

    if (updates.length === 0 && !data.modifiedBy) {
      return this.getById(choiceId);
    }

    updates.push('ModifiedOn = SYSUTCDATETIME()');

    if (data.modifiedBy) {
      request.input('modifiedBy', sql.UniqueIdentifier, data.modifiedBy);
      updates.push('ModifiedBy = @modifiedBy');
    }

    await request.query(`
      UPDATE dbo.cor_DynamicDropChoices
      SET ${updates.join(', ')}
      WHERE ChoiceID = @choiceId
    `);

    return this.getById(choiceId);
  }

  static async clearOtherDefaults(groupId, excludeChoiceId) {
    const pool = await getConnection();
    await pool.request()
      .input('groupId', sql.VarChar(100), groupId)
      .input('excludeChoiceId', sql.UniqueIdentifier, excludeChoiceId)
      .query(`
        UPDATE dbo.cor_DynamicDropChoices
        SET IsDefault = 0, ModifiedOn = SYSUTCDATETIME()
        WHERE GroupID = @groupId
          AND ChoiceID != @excludeChoiceId
          AND IsDefault = 1
      `);
    
    return { success: true };
  }

  static async bulkUpdateOrder(groupId, choices, modifiedBy) {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      for (let i = 0; i < choices.length; i++) {
        const choice = choices[i];
        const request = new sql.Request(transaction);
        request
          .input('choiceId', sql.UniqueIdentifier, choice.choiceId)
          .input('groupId', sql.VarChar(100), groupId)
          .input('displayOrder', sql.Int, i + 1);

        let modifiedByClause = '';
        if (modifiedBy) {
          request.input('modifiedBy', sql.UniqueIdentifier, modifiedBy);
          modifiedByClause = ', ModifiedBy = @modifiedBy';
        }

        await request.query(`
          UPDATE dbo.cor_DynamicDropChoices
          SET DisplayOrder = @displayOrder, ModifiedOn = SYSUTCDATETIME()${modifiedByClause}
          WHERE ChoiceID = @choiceId
            AND GroupID = @groupId
        `);
      }

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = DynamicDropChoices;

