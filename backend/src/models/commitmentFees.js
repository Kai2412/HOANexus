const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

class CommitmentFees {
  // Get all commitment fees for a community (grouped by commitment type)
  static async getByCommunity(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            cf.CommitmentFeeID,
            cf.CommunityID,
            cf.CommitmentTypeID,
            cf.EntryType,
            cf.FeeName,
            cf.Value,
            cf.Notes,
            cf.IsActive,
            cf.CreatedOn,
            cf.CreatedBy,
            cf.ModifiedOn,
            cf.ModifiedBy,
            ddc.ChoiceValue AS CommitmentTypeName,
            ddc.DisplayOrder AS CommitmentTypeDisplayOrder
          FROM dbo.cor_CommitmentFees cf
          INNER JOIN dbo.cor_DynamicDropChoices ddc ON cf.CommitmentTypeID = ddc.ChoiceID
          WHERE cf.CommunityID = @communityId 
            AND cf.IsActive = 1
            AND ddc.IsActive = 1
          ORDER BY ddc.DisplayOrder, ddc.ChoiceValue, cf.EntryType, cf.FeeName
        `);
      return result.recordset;
    } catch (error) {
      logger.databaseError('fetch', 'commitment fees by community', error, 'CommitmentFeesModel');
      throw new Error('Error fetching commitment fees: ' + error.message);
    }
  }

  // Get commitment fee by ID
  static async getById(commitmentFeeId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('commitmentFeeId', sql.UniqueIdentifier, commitmentFeeId)
        .query(`
          SELECT 
            cf.CommitmentFeeID,
            cf.CommunityID,
            cf.CommitmentTypeID,
            cf.EntryType,
            cf.FeeName,
            cf.Value,
            cf.Notes,
            cf.IsActive,
            cf.CreatedOn,
            cf.CreatedBy,
            cf.ModifiedOn,
            cf.ModifiedBy,
            ddc.ChoiceValue AS CommitmentTypeName
          FROM dbo.cor_CommitmentFees cf
          INNER JOIN dbo.cor_DynamicDropChoices ddc ON cf.CommitmentTypeID = ddc.ChoiceID
          WHERE cf.CommitmentFeeID = @commitmentFeeId
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'commitment fee by ID', error, 'CommitmentFeesModel');
      throw new Error('Error fetching commitment fee: ' + error.message);
    }
  }

  // Create new commitment fee
  static async create(payload, createdBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Validate EntryType
      if (payload.EntryType && !['Compensation', 'Commitment'].includes(payload.EntryType)) {
        throw new Error('Invalid EntryType. Must be Compensation or Commitment');
      }

      request.input('CommunityID', sql.UniqueIdentifier, payload.CommunityID);
      request.input('CommitmentTypeID', sql.UniqueIdentifier, payload.CommitmentTypeID);
      request.input('EntryType', sql.NVarChar(50), payload.EntryType || 'Compensation');
      request.input('FeeName', sql.NVarChar(200), payload.FeeName);
      // Value is only required for Compensation, NULL for Commitment
      // Handle null/undefined/empty string for Commitment entries
      let valueParam = null;
      if (payload.EntryType === 'Compensation') {
        // For Compensation, Value must be provided
        if (payload.Value !== undefined && payload.Value !== null && payload.Value !== '') {
          valueParam = parseFloat(payload.Value);
          if (isNaN(valueParam)) {
            throw new Error('Value must be a valid number for Compensation entries');
          }
        } else {
          throw new Error('Value is required for Compensation entries');
        }
      }
      // For Commitment, Value is always null (not used)
      // Use Decimal type but pass null - SQL Server will accept null for nullable columns
      request.input('Value', sql.Decimal(12, 2), valueParam);
      request.input('Notes', sql.NVarChar(500), payload.Notes || null);
      request.input('CreatedBy', sql.UniqueIdentifier, createdBy);

      const result = await request.query(`
        INSERT INTO dbo.cor_CommitmentFees 
          (CommunityID, CommitmentTypeID, EntryType, FeeName, Value, Notes, CreatedBy)
        OUTPUT INSERTED.CommitmentFeeID
        VALUES (@CommunityID, @CommitmentTypeID, @EntryType, @FeeName, @Value, @Notes, @CreatedBy)
      `);

      const newId = result.recordset[0].CommitmentFeeID;
      return await this.getById(newId);
    } catch (error) {
      logger.databaseError('create', 'commitment fee', error, 'CommitmentFeesModel');
      throw new Error('Error creating commitment fee: ' + error.message);
    }
  }

  // Update commitment fee
  static async update(id, payload, modifiedBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      const updates = [];
      request.input('id', sql.UniqueIdentifier, id);
      request.input('ModifiedBy', sql.UniqueIdentifier, modifiedBy);

      if (payload.CommitmentTypeID !== undefined) {
        updates.push('CommitmentTypeID = @CommitmentTypeID');
        request.input('CommitmentTypeID', sql.UniqueIdentifier, payload.CommitmentTypeID);
      }

      if (payload.EntryType !== undefined) {
        // Validate EntryType
        if (!['Compensation', 'Commitment'].includes(payload.EntryType)) {
          throw new Error('Invalid EntryType. Must be Compensation or Commitment');
        }
        updates.push('EntryType = @EntryType');
        request.input('EntryType', sql.NVarChar(50), payload.EntryType);
      }

      if (payload.FeeName !== undefined) {
        updates.push('FeeName = @FeeName');
        request.input('FeeName', sql.NVarChar(200), payload.FeeName);
      }

      if (payload.Value !== undefined) {
        updates.push('Value = @Value');
        // Value is only for Compensation, NULL for Commitment
        let valueParam = null;
        if (payload.EntryType === 'Compensation' || (payload.EntryType === undefined && payload.Value !== null && payload.Value !== '')) {
          // Only parse if it's Compensation or if Value is provided
          if (payload.Value !== null && payload.Value !== '') {
            valueParam = parseFloat(payload.Value);
            if (isNaN(valueParam)) {
              throw new Error('Value must be a valid number');
            }
          }
        }
        // Use Decimal type but pass null - SQL Server will accept null for nullable columns
        request.input('Value', sql.Decimal(12, 2), valueParam);
      }

      if (payload.Notes !== undefined) {
        updates.push('Notes = @Notes');
        request.input('Notes', sql.NVarChar(500), payload.Notes || null);
      }

      if (updates.length === 0) {
        return await this.getById(id);
      }

      updates.push('ModifiedOn = SYSUTCDATETIME()');
      updates.push('ModifiedBy = @ModifiedBy');

      await request.query(`
        UPDATE dbo.cor_CommitmentFees 
        SET ${updates.join(', ')}
        WHERE CommitmentFeeID = @id AND IsActive = 1
      `);

      return await this.getById(id);
    } catch (error) {
      logger.databaseError('update', 'commitment fee', error, 'CommitmentFeesModel');
      throw new Error('Error updating commitment fee: ' + error.message);
    }
  }

  // Delete commitment fee (soft delete)
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          UPDATE dbo.cor_CommitmentFees 
          SET IsActive = 0, ModifiedOn = SYSUTCDATETIME()
          WHERE CommitmentFeeID = @id
        `);
      return true;
    } catch (error) {
      logger.databaseError('delete', 'commitment fee', error, 'CommitmentFeesModel');
      throw new Error('Error deleting commitment fee: ' + error.message);
    }
  }
}

module.exports = CommitmentFees;

