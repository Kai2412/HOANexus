const { sql, getConnection } = require('../config/database');

class Stakeholder {
  // Get all stakeholders
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            ID,
            [Type],
            SubType,
            AccessLevel,
            CommunityID,
            FirstName,
            LastName,
            CompanyName,
            Email,
            Phone,
            MobilePhone,
            PreferredContactMethod,
            Status,
            PortalAccessEnabled,
            LastLoginDate,
            CreatedDate,
            Notes,
            IsActive
          FROM cor_Stakeholders 
          WHERE IsActive = 1
          ORDER BY LastName, FirstName
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching stakeholders: ${error.message}`);
    }
  }

  // Get stakeholder by ID
  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            ID,
            [Type],
            SubType,
            AccessLevel,
            CommunityID,
            FirstName,
            LastName,
            CompanyName,
            Email,
            Phone,
            MobilePhone,
            PreferredContactMethod,
            Status,
            PortalAccessEnabled,
            LastLoginDate,
            CreatedDate,
            Notes,
            IsActive
          FROM cor_Stakeholders 
          WHERE ID = @id AND IsActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching stakeholder: ${error.message}`);
    }
  }

  // Get stakeholders by type
  static async getByType(stakeholderType) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('stakeholderType', sql.VarChar(50), stakeholderType)
        .query(`
          SELECT 
            ID,
            [Type],
            FirstName,
            LastName,
            CompanyName,
            Email,
            Phone,
            MobilePhone,
            PreferredContactMethod,
            Status,
            IsActive
          FROM cor_Stakeholders 
          WHERE [Type] = @stakeholderType AND IsActive = 1
          ORDER BY LastName, FirstName
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching stakeholders by type: ${error.message}`);
    }
  }

  // Create new stakeholder
  static async create(stakeholderData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('Type', sql.VarChar(50), stakeholderData.Type)
        .input('SubType', sql.VarChar(50), stakeholderData.SubType)
        .input('AccessLevel', sql.VarChar(20), stakeholderData.AccessLevel)
        .input('CommunityID', sql.Int, stakeholderData.CommunityID)
        .input('FirstName', sql.NVarChar(100), stakeholderData.FirstName)
        .input('LastName', sql.NVarChar(100), stakeholderData.LastName)
        .input('CompanyName', sql.NVarChar(255), stakeholderData.CompanyName)
        .input('Email', sql.NVarChar(255), stakeholderData.Email)
        .input('Phone', sql.VarChar(30), stakeholderData.Phone)
        .input('MobilePhone', sql.VarChar(30), stakeholderData.MobilePhone)
        .input('PreferredContactMethod', sql.VarChar(50), stakeholderData.PreferredContactMethod)
        .input('Status', sql.VarChar(50), stakeholderData.Status)
        .input('PortalAccessEnabled', sql.Bit, stakeholderData.PortalAccessEnabled)
        .input('Notes', sql.NVarChar(500), stakeholderData.Notes)
        .query(`
          INSERT INTO cor_Stakeholders (
            [Type], SubType, AccessLevel, CommunityID, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, 
            PreferredContactMethod, Status, PortalAccessEnabled, Notes, IsActive
          )
          OUTPUT INSERTED.ID
          VALUES (
            @Type, @SubType, @AccessLevel, @CommunityID, @FirstName, @LastName, @CompanyName, @Email, @Phone, @MobilePhone,
            @PreferredContactMethod, @Status, @PortalAccessEnabled, @Notes, 1
          )
        `);
      
      const newId = result.recordset[0].ID;
      return await this.getById(newId);
    } catch (error) {
      throw new Error(`Error creating stakeholder: ${error.message}`);
    }
  }

  // Update stakeholder
  static async update(id, stakeholderData) {
    try {
      const pool = await getConnection();
      
      // Build dynamic query based on provided fields
      const updateFields = [];
      const request = pool.request().input('id', sql.Int, id);
      
      if (stakeholderData.Type !== undefined) {
        updateFields.push('[Type] = @Type');
        request.input('Type', sql.VarChar(50), stakeholderData.Type);
      }
      if (stakeholderData.SubType !== undefined) {
        updateFields.push('SubType = @SubType');
        request.input('SubType', sql.VarChar(50), stakeholderData.SubType);
      }
      if (stakeholderData.AccessLevel !== undefined) {
        updateFields.push('AccessLevel = @AccessLevel');
        request.input('AccessLevel', sql.VarChar(20), stakeholderData.AccessLevel);
      }
      if (stakeholderData.CommunityID !== undefined) {
        updateFields.push('CommunityID = @CommunityID');
        request.input('CommunityID', sql.Int, stakeholderData.CommunityID);
      }
      if (stakeholderData.FirstName !== undefined) {
        updateFields.push('FirstName = @FirstName');
        request.input('FirstName', sql.NVarChar(100), stakeholderData.FirstName);
      }
      if (stakeholderData.LastName !== undefined) {
        updateFields.push('LastName = @LastName');
        request.input('LastName', sql.NVarChar(100), stakeholderData.LastName);
      }
      if (stakeholderData.CompanyName !== undefined) {
        updateFields.push('CompanyName = @CompanyName');
        request.input('CompanyName', sql.NVarChar(255), stakeholderData.CompanyName);
      }
      if (stakeholderData.Email !== undefined) {
        updateFields.push('Email = @Email');
        request.input('Email', sql.NVarChar(255), stakeholderData.Email);
      }
      if (stakeholderData.Phone !== undefined) {
        updateFields.push('Phone = @Phone');
        request.input('Phone', sql.VarChar(30), stakeholderData.Phone);
      }
      if (stakeholderData.MobilePhone !== undefined) {
        updateFields.push('MobilePhone = @MobilePhone');
        request.input('MobilePhone', sql.VarChar(30), stakeholderData.MobilePhone);
      }
      if (stakeholderData.PreferredContactMethod !== undefined) {
        updateFields.push('PreferredContactMethod = @PreferredContactMethod');
        request.input('PreferredContactMethod', sql.VarChar(50), stakeholderData.PreferredContactMethod);
      }
      if (stakeholderData.Status !== undefined) {
        updateFields.push('Status = @Status');
        request.input('Status', sql.VarChar(50), stakeholderData.Status);
      }
      if (stakeholderData.PortalAccessEnabled !== undefined) {
        updateFields.push('PortalAccessEnabled = @PortalAccessEnabled');
        request.input('PortalAccessEnabled', sql.Bit, stakeholderData.PortalAccessEnabled);
      }
      if (stakeholderData.Notes !== undefined) {
        updateFields.push('Notes = @Notes');
        request.input('Notes', sql.NVarChar(500), stakeholderData.Notes);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      await request.query(`
        UPDATE cor_Stakeholders SET
          ${updateFields.join(', ')}
        WHERE ID = @id AND IsActive = 1
      `);
      
      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating stakeholder: ${error.message}`);
    }
  }

  // Soft delete stakeholder
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE cor_Stakeholders 
          SET IsActive = 0 
          WHERE ID = @id
        `);
      return { success: true, message: 'Stakeholder deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting stakeholder: ${error.message}`);
    }
  }
}

module.exports = Stakeholder;