const { sql, getConnection } = require('../config/database');

class Stakeholder {
  // Get all stakeholders
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            StakeholderID,
            [Type],
            SubType,
            AccessLevel,
            Department,
            Title,
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
            Notes,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy,
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
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          SELECT 
            StakeholderID,
            [Type],
            SubType,
            AccessLevel,
            Department,
            Title,
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
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy,
            IsActive
          FROM cor_Stakeholders 
          WHERE StakeholderID = @id AND IsActive = 1
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
        .input('stakeholderType', sql.NVarChar(50), stakeholderType)
        .query(`
          SELECT 
            StakeholderID,
            [Type],
            SubType,
            AccessLevel,
            Department,
            Title,
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
            Notes,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy,
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
        .input('Type', sql.NVarChar(50), stakeholderData.Type)
        .input('SubType', sql.NVarChar(50), stakeholderData.SubType)
        .input('AccessLevel', sql.NVarChar(50), stakeholderData.AccessLevel)
        .input('Department', sql.NVarChar(100), stakeholderData.Department)
        .input('Title', sql.NVarChar(100), stakeholderData.Title)
        .input('CommunityID', sql.UniqueIdentifier, stakeholderData.CommunityID || null)
        .input('FirstName', sql.NVarChar(100), stakeholderData.FirstName)
        .input('LastName', sql.NVarChar(100), stakeholderData.LastName)
        .input('CompanyName', sql.NVarChar(255), stakeholderData.CompanyName)
        .input('Email', sql.NVarChar(255), stakeholderData.Email)
        .input('Phone', sql.NVarChar(30), stakeholderData.Phone)
        .input('MobilePhone', sql.NVarChar(30), stakeholderData.MobilePhone)
        .input('PreferredContactMethod', sql.NVarChar(20), stakeholderData.PreferredContactMethod)
        .input('Status', sql.NVarChar(20), stakeholderData.Status)
        .input('PortalAccessEnabled', sql.Bit, stakeholderData.PortalAccessEnabled || false)
        .input('Notes', sql.NVarChar(500), stakeholderData.Notes)
        .input('CreatedBy', sql.UniqueIdentifier, stakeholderData.CreatedBy || null)
        .query(`
          INSERT INTO cor_Stakeholders (
            [Type], SubType, AccessLevel, Department, Title, CommunityID, FirstName, LastName, CompanyName, Email, Phone, MobilePhone, 
            PreferredContactMethod, Status, PortalAccessEnabled, Notes, CreatedBy, IsActive
          )
          OUTPUT INSERTED.StakeholderID, INSERTED.Email, INSERTED.PortalAccessEnabled
          VALUES (
            @Type, @SubType, @AccessLevel, @Department, @Title, @CommunityID, @FirstName, @LastName, @CompanyName, @Email, @Phone, @MobilePhone,
            @PreferredContactMethod, @Status, @PortalAccessEnabled, @Notes, @CreatedBy, 1
          )
        `);
      
      const newStakeholder = result.recordset[0];
      return await this.getById(newStakeholder.StakeholderID);
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
      const request = pool.request().input('id', sql.UniqueIdentifier, id);
      
      if (stakeholderData.Type !== undefined) {
        updateFields.push('[Type] = @Type');
        request.input('Type', sql.NVarChar(50), stakeholderData.Type);
      }
      if (stakeholderData.SubType !== undefined) {
        updateFields.push('SubType = @SubType');
        request.input('SubType', sql.NVarChar(50), stakeholderData.SubType);
      }
      if (stakeholderData.AccessLevel !== undefined) {
        updateFields.push('AccessLevel = @AccessLevel');
        request.input('AccessLevel', sql.NVarChar(50), stakeholderData.AccessLevel);
      }
      if (stakeholderData.Department !== undefined) {
        updateFields.push('Department = @Department');
        request.input('Department', sql.NVarChar(100), stakeholderData.Department);
      }
      if (stakeholderData.Title !== undefined) {
        updateFields.push('Title = @Title');
        request.input('Title', sql.NVarChar(100), stakeholderData.Title);
      }
      if (stakeholderData.CommunityID !== undefined) {
        updateFields.push('CommunityID = @CommunityID');
        request.input('CommunityID', sql.UniqueIdentifier, stakeholderData.CommunityID || null);
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
        request.input('Phone', sql.NVarChar(30), stakeholderData.Phone);
      }
      if (stakeholderData.MobilePhone !== undefined) {
        updateFields.push('MobilePhone = @MobilePhone');
        request.input('MobilePhone', sql.NVarChar(30), stakeholderData.MobilePhone);
      }
      if (stakeholderData.PreferredContactMethod !== undefined) {
        updateFields.push('PreferredContactMethod = @PreferredContactMethod');
        request.input('PreferredContactMethod', sql.NVarChar(20), stakeholderData.PreferredContactMethod);
      }
      if (stakeholderData.Status !== undefined) {
        updateFields.push('Status = @Status');
        request.input('Status', sql.NVarChar(20), stakeholderData.Status);
      }
      if (stakeholderData.PortalAccessEnabled !== undefined) {
        updateFields.push('PortalAccessEnabled = @PortalAccessEnabled');
        request.input('PortalAccessEnabled', sql.Bit, stakeholderData.PortalAccessEnabled);
      }
      if (stakeholderData.Notes !== undefined) {
        updateFields.push('Notes = @Notes');
        request.input('Notes', sql.NVarChar(500), stakeholderData.Notes);
      }
      if (stakeholderData.ModifiedBy !== undefined) {
        updateFields.push('ModifiedBy = @ModifiedBy');
        request.input('ModifiedBy', sql.UniqueIdentifier, stakeholderData.ModifiedBy);
        updateFields.push('ModifiedOn = SYSUTCDATETIME()');
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      await request.query(`
        UPDATE cor_Stakeholders SET
          ${updateFields.join(', ')}
        WHERE StakeholderID = @id AND IsActive = 1
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
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          UPDATE cor_Stakeholders 
          SET IsActive = 0 
          WHERE StakeholderID = @id
        `);
      return { success: true, message: 'Stakeholder deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting stakeholder: ${error.message}`);
    }
  }

  // Search stakeholders
  static async search(searchTerm) {
    try {
      const pool = await getConnection();
      const searchPattern = `%${searchTerm}%`;
      const result = await pool.request()
        .input('searchTerm', sql.NVarChar(255), searchPattern)
        .query(`
          SELECT 
            StakeholderID,
            [Type],
            SubType,
            AccessLevel,
            Department,
            Title,
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
            Notes,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy,
            IsActive
          FROM cor_Stakeholders 
          WHERE IsActive = 1
            AND (
              FirstName LIKE @searchTerm
              OR LastName LIKE @searchTerm
              OR CompanyName LIKE @searchTerm
              OR Email LIKE @searchTerm
              OR Phone LIKE @searchTerm
              OR MobilePhone LIKE @searchTerm
            )
          ORDER BY LastName, FirstName
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Error searching stakeholders: ${error.message}`);
    }
  }

  // Get stakeholder with properties (if needed in future)
  static async getStakeholderWithProperties(id) {
    try {
      const stakeholder = await this.getById(id);
      if (!stakeholder) {
        return null;
      }
      // In the future, this could join with properties table
      // For now, just return the stakeholder
      return [stakeholder];
    } catch (error) {
      throw new Error(`Error fetching stakeholder with properties: ${error.message}`);
    }
  }
}

module.exports = Stakeholder;