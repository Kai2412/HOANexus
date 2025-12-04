const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

class CommunityFeeVariance {
  // Get all variances for a community (with fee master info joined)
  static async getByCommunity(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            cfv.CommunityFeeVarianceID,
            cfv.CommunityID,
            cfv.FeeMasterID,
            cfv.VarianceType,
            cfv.CustomAmount,
            cfv.Notes,
            cfv.IsActive,
            cfv.CreatedOn,
            cfv.CreatedBy,
            cfv.ModifiedOn,
            cfv.ModifiedBy,
            fm.FeeName,
            fm.DefaultAmount,
            fm.DisplayOrder AS FeeDisplayOrder
          FROM dbo.cor_CommunityFeeVariances cfv
          INNER JOIN dbo.cor_FeeMaster fm ON cfv.FeeMasterID = fm.FeeMasterID
          WHERE cfv.CommunityID = @communityId 
            AND cfv.IsActive = 1
            AND fm.IsActive = 1
          ORDER BY fm.DisplayOrder, fm.FeeName
        `);
      return result.recordset;
    } catch (error) {
      logger.databaseError('fetch', 'community fee variances by community', error, 'CommunityFeeVarianceModel');
      throw new Error('Error fetching community fee variances: ' + error.message);
    }
  }

  // Get variance by ID
  static async getById(varianceId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('varianceId', sql.UniqueIdentifier, varianceId)
        .query(`
          SELECT 
            cfv.CommunityFeeVarianceID,
            cfv.CommunityID,
            cfv.FeeMasterID,
            cfv.VarianceType,
            cfv.CustomAmount,
            cfv.Notes,
            cfv.IsActive,
            cfv.CreatedOn,
            cfv.CreatedBy,
            cfv.ModifiedOn,
            cfv.ModifiedBy,
            fm.FeeName,
            fm.DefaultAmount,
            fm.DisplayOrder AS FeeDisplayOrder
          FROM dbo.cor_CommunityFeeVariances cfv
          INNER JOIN dbo.cor_FeeMaster fm ON cfv.FeeMasterID = fm.FeeMasterID
          WHERE cfv.CommunityFeeVarianceID = @varianceId
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'community fee variance by ID', error, 'CommunityFeeVarianceModel');
      throw new Error('Error fetching community fee variance: ' + error.message);
    }
  }

  // Get variance by community and fee master (for checking if exists)
  static async getByCommunityAndFee(communityId, feeMasterId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .input('feeMasterId', sql.UniqueIdentifier, feeMasterId)
        .query(`
          SELECT 
            cfv.CommunityFeeVarianceID,
            cfv.CommunityID,
            cfv.FeeMasterID,
            cfv.VarianceType,
            cfv.CustomAmount,
            cfv.Notes,
            cfv.IsActive,
            cfv.CreatedOn,
            cfv.CreatedBy,
            cfv.ModifiedOn,
            cfv.ModifiedBy
          FROM dbo.cor_CommunityFeeVariances cfv
          WHERE cfv.CommunityID = @communityId 
            AND cfv.FeeMasterID = @feeMasterId
            AND cfv.IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'community fee variance by community and fee', error, 'CommunityFeeVarianceModel');
      throw new Error('Error fetching community fee variance: ' + error.message);
    }
  }

  // Create new variance
  static async create(payload, createdBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Validate VarianceType
      if (!['Standard', 'Not Billed', 'Custom'].includes(payload.VarianceType)) {
        throw new Error('Invalid VarianceType. Must be Standard, Not Billed, or Custom');
      }

      // Validate CustomAmount for Custom type
      if (payload.VarianceType === 'Custom' && (payload.CustomAmount === null || payload.CustomAmount === undefined)) {
        throw new Error('CustomAmount is required when VarianceType is Custom');
      }

      // Ensure CustomAmount is null for non-Custom types
      if (payload.VarianceType !== 'Custom') {
        payload.CustomAmount = null;
      }

      request.input('CommunityID', sql.UniqueIdentifier, payload.CommunityID);
      request.input('FeeMasterID', sql.UniqueIdentifier, payload.FeeMasterID);
      request.input('VarianceType', sql.NVarChar(50), payload.VarianceType);
      request.input('CustomAmount', sql.Decimal(12, 2), payload.CustomAmount);
      request.input('Notes', sql.NVarChar(500), payload.Notes || null);
      request.input('CreatedBy', sql.UniqueIdentifier, createdBy);

      const result = await request.query(`
        INSERT INTO dbo.cor_CommunityFeeVariances 
          (CommunityID, FeeMasterID, VarianceType, CustomAmount, Notes, CreatedBy)
        OUTPUT INSERTED.CommunityFeeVarianceID
        VALUES (@CommunityID, @FeeMasterID, @VarianceType, @CustomAmount, @Notes, @CreatedBy)
      `);

      const newId = result.recordset[0].CommunityFeeVarianceID;
      return await this.getById(newId);
    } catch (error) {
      logger.databaseError('create', 'community fee variance', error, 'CommunityFeeVarianceModel');
      throw new Error('Error creating community fee variance: ' + error.message);
    }
  }

  // Update variance
  static async update(id, payload, modifiedBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      const updates = [];
      request.input('id', sql.UniqueIdentifier, id);
      request.input('ModifiedBy', sql.UniqueIdentifier, modifiedBy);

      if (payload.VarianceType !== undefined) {
        // Validate VarianceType
        if (!['Standard', 'Not Billed', 'Custom'].includes(payload.VarianceType)) {
          throw new Error('Invalid VarianceType. Must be Standard, Not Billed, or Custom');
        }

        updates.push('VarianceType = @VarianceType');
        request.input('VarianceType', sql.NVarChar(50), payload.VarianceType);

        // Handle CustomAmount based on VarianceType
        if (payload.VarianceType === 'Custom') {
          if (payload.CustomAmount === null || payload.CustomAmount === undefined) {
            throw new Error('CustomAmount is required when VarianceType is Custom');
          }
          updates.push('CustomAmount = @CustomAmount');
          request.input('CustomAmount', sql.Decimal(12, 2), payload.CustomAmount);
        } else {
          updates.push('CustomAmount = NULL');
        }
      } else if (payload.CustomAmount !== undefined) {
        // If updating CustomAmount, need to check current VarianceType
        const current = await this.getById(id);
        if (!current) {
          throw new Error('Variance not found');
        }
        if (current.VarianceType === 'Custom') {
          updates.push('CustomAmount = @CustomAmount');
          request.input('CustomAmount', sql.Decimal(12, 2), payload.CustomAmount);
        } else {
          throw new Error('Cannot set CustomAmount when VarianceType is not Custom');
        }
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
        UPDATE dbo.cor_CommunityFeeVariances 
        SET ${updates.join(', ')}
        WHERE CommunityFeeVarianceID = @id AND IsActive = 1
      `);

      return await this.getById(id);
    } catch (error) {
      logger.databaseError('update', 'community fee variance', error, 'CommunityFeeVarianceModel');
      throw new Error('Error updating community fee variance: ' + error.message);
    }
  }

  // Delete variance (soft delete)
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          UPDATE dbo.cor_CommunityFeeVariances 
          SET IsActive = 0, ModifiedOn = SYSUTCDATETIME()
          WHERE CommunityFeeVarianceID = @id
        `);
      return true;
    } catch (error) {
      logger.databaseError('delete', 'community fee variance', error, 'CommunityFeeVarianceModel');
      throw new Error('Error deleting community fee variance: ' + error.message);
    }
  }
}

module.exports = CommunityFeeVariance;

