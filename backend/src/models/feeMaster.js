const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

class FeeMaster {
  // Get all active fees, ordered by DisplayOrder
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT 
          FeeMasterID,
          FeeName,
          DefaultAmount,
          DisplayOrder,
          IsActive,
          CreatedOn,
          CreatedBy,
          ModifiedOn,
          ModifiedBy
        FROM dbo.cor_FeeMaster
        WHERE IsActive = 1
        ORDER BY DisplayOrder, FeeName
      `);
      return result.recordset;
    } catch (error) {
      logger.databaseError('fetch', 'all fee master records', error, 'FeeMasterModel');
      throw new Error('Error fetching fee master records: ' + error.message);
    }
  }

  // Get fee by ID
  static async getById(feeMasterId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('feeMasterId', sql.UniqueIdentifier, feeMasterId)
        .query(`
          SELECT 
            FeeMasterID,
            FeeName,
            DefaultAmount,
            DisplayOrder,
            IsActive,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
          FROM dbo.cor_FeeMaster
          WHERE FeeMasterID = @feeMasterId
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'fee master by ID', error, 'FeeMasterModel');
      throw new Error('Error fetching fee master record: ' + error.message);
    }
  }

  // Create new fee
  static async create(payload, createdBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Get max DisplayOrder to append new fee at end
      const maxOrderResult = await pool.request().query(`
        SELECT ISNULL(MAX(DisplayOrder), 0) AS MaxOrder
        FROM dbo.cor_FeeMaster
      `);
      const maxOrder = maxOrderResult.recordset[0].MaxOrder;
      const displayOrder = payload.DisplayOrder !== undefined ? payload.DisplayOrder : maxOrder + 1;

      request.input('FeeName', sql.NVarChar(200), payload.FeeName);
      request.input('DefaultAmount', sql.Decimal(12, 2), payload.DefaultAmount);
      request.input('DisplayOrder', sql.Int, displayOrder);
      request.input('IsActive', sql.Bit, payload.IsActive !== undefined ? payload.IsActive : true);
      request.input('CreatedBy', sql.UniqueIdentifier, createdBy);

      const result = await request.query(`
        INSERT INTO dbo.cor_FeeMaster (FeeName, DefaultAmount, DisplayOrder, IsActive, CreatedBy)
        OUTPUT INSERTED.FeeMasterID
        VALUES (@FeeName, @DefaultAmount, @DisplayOrder, @IsActive, @CreatedBy)
      `);

      const newId = result.recordset[0].FeeMasterID;
      return await this.getById(newId);
    } catch (error) {
      logger.databaseError('create', 'fee master', error, 'FeeMasterModel');
      throw new Error('Error creating fee master record: ' + error.message);
    }
  }

  // Update fee
  static async update(id, payload, modifiedBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      const updates = [];
      request.input('id', sql.UniqueIdentifier, id);
      request.input('ModifiedBy', sql.UniqueIdentifier, modifiedBy);

      if (payload.FeeName !== undefined) {
        updates.push('FeeName = @FeeName');
        request.input('FeeName', sql.NVarChar(200), payload.FeeName);
      }

      if (payload.DefaultAmount !== undefined) {
        updates.push('DefaultAmount = @DefaultAmount');
        request.input('DefaultAmount', sql.Decimal(12, 2), payload.DefaultAmount);
      }

      if (payload.DisplayOrder !== undefined) {
        updates.push('DisplayOrder = @DisplayOrder');
        request.input('DisplayOrder', sql.Int, payload.DisplayOrder);
      }

      if (payload.IsActive !== undefined) {
        updates.push('IsActive = @IsActive');
        request.input('IsActive', sql.Bit, payload.IsActive);
      }

      if (updates.length === 0) {
        return await this.getById(id);
      }

      updates.push('ModifiedOn = SYSUTCDATETIME()');
      updates.push('ModifiedBy = @ModifiedBy');

      await request.query(`
        UPDATE dbo.cor_FeeMaster 
        SET ${updates.join(', ')}
        WHERE FeeMasterID = @id
      `);

      return await this.getById(id);
    } catch (error) {
      logger.databaseError('update', 'fee master', error, 'FeeMasterModel');
      throw new Error('Error updating fee master record: ' + error.message);
    }
  }

  // Delete fee (soft delete by setting IsActive = 0)
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          UPDATE dbo.cor_FeeMaster 
          SET IsActive = 0, ModifiedOn = SYSUTCDATETIME()
          WHERE FeeMasterID = @id
        `);
      return true;
    } catch (error) {
      logger.databaseError('delete', 'fee master', error, 'FeeMasterModel');
      throw new Error('Error deleting fee master record: ' + error.message);
    }
  }

  // Bulk update display order
  static async bulkUpdateOrder(feeOrders) {
    try {
      const pool = await getConnection();
      const transaction = new sql.Transaction(pool);

      await transaction.begin();

      try {
        for (const { feeMasterId, displayOrder } of feeOrders) {
          await transaction.request()
            .input('feeMasterId', sql.UniqueIdentifier, feeMasterId)
            .input('displayOrder', sql.Int, displayOrder)
            .query(`
              UPDATE dbo.cor_FeeMaster 
              SET DisplayOrder = @displayOrder, ModifiedOn = SYSUTCDATETIME()
              WHERE FeeMasterID = @feeMasterId
            `);
        }

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.databaseError('bulk update order', 'fee master', error, 'FeeMasterModel');
      throw new Error('Error updating fee order: ' + error.message);
    }
  }
}

module.exports = FeeMaster;

