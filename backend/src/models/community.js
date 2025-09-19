const { sql, getConnection } = require('../config/database');

class Community {
  // Get all communities WITH property counts
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            c.ID,
            c.Pcode,
            c.Name,
            c.DisplayName,
            c.CommunityType,
            c.Status,
            c.FormationDate,
            c.FiscalYearStart,
            c.FiscalYearEnd,
            c.ContractStartDate,
            c.ContractEndDate,
            c.TaxID,
            c.TimeZone,
            c.MasterAssociation,
            c.IsSubAssociation,
            c.LastAuditDate,
            c.NextAuditDate,
            c.DataCompleteness,
            c.IsActive,
            c.State,
            c.City,
            c.AddressLine1,
            c.AddressLine2,
            c.PostalCode,
            c.Country,
            c.CreatedDate,
            c.LastUpdated,
            COUNT(p.ID) as PropertyCount
          FROM cor_Communities c
          LEFT JOIN cor_Properties p ON c.ID = p.CommunityID AND p.IsActive = 1
          WHERE c.IsActive = 1
          GROUP BY c.ID, c.Pcode, c.Name, c.DisplayName, c.CommunityType, c.Status,
                   c.FormationDate, c.FiscalYearStart, c.FiscalYearEnd, c.ContractStartDate,
                   c.ContractEndDate, c.TaxID, c.TimeZone, c.MasterAssociation,
                   c.IsSubAssociation, c.LastAuditDate, c.NextAuditDate, c.DataCompleteness, c.IsActive,
                   c.State, c.City, c.AddressLine1, c.AddressLine2, c.PostalCode, c.Country, c.CreatedDate, c.LastUpdated
          ORDER BY c.Name
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching communities: ${error.message}`);
    }
  }

  // Get community by ID
  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            ID,
            Pcode,
            Name,
            DisplayName,
            CommunityType,
            Status,
            FormationDate,
            FiscalYearStart,
            FiscalYearEnd,
            ContractStartDate,
            ContractEndDate,
            TaxID,
            TimeZone,
            MasterAssociation,
            IsSubAssociation,
            LastAuditDate,
            NextAuditDate,
            DataCompleteness,
            IsActive,
            State,
            City,
            AddressLine1,
            AddressLine2,
            PostalCode,
            Country,
            CreatedDate,
            LastUpdated
          FROM cor_Communities 
          WHERE ID = @id AND IsActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching community: ${error.message}`);
    }
  }

  // Create new community
  static async create(communityData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('Pcode', sql.VarChar(50), communityData.Pcode)
        .input('Name', sql.NVarChar(255), communityData.Name)
        .input('DisplayName', sql.NVarChar(255), communityData.DisplayName)
        .input('CommunityType', sql.VarChar(50), communityData.CommunityType)
        .input('Status', sql.VarChar(50), communityData.Status || 'Active')
        .input('FormationDate', sql.Date, communityData.FormationDate)
        .input('FiscalYearStart', sql.Date, communityData.FiscalYearStart)
        .input('FiscalYearEnd', sql.Date, communityData.FiscalYearEnd)
        .input('ContractStartDate', sql.Date, communityData.ContractStartDate)
        .input('ContractEndDate', sql.Date, communityData.ContractEndDate)
        .input('TaxID', sql.VarChar(50), communityData.TaxID)
        .input('TimeZone', sql.VarChar(50), communityData.TimeZone || 'UTC')
        .input('MasterAssociation', sql.VarChar(255), communityData.MasterAssociation)
        .input('IsSubAssociation', sql.Bit, communityData.IsSubAssociation || 0)
        .input('LastAuditDate', sql.Date, communityData.LastAuditDate)
        .input('NextAuditDate', sql.Date, communityData.NextAuditDate)
        .input('DataCompleteness', sql.Float, communityData.DataCompleteness || 0)
        .query(`
          INSERT INTO cor_Communities (
            Pcode, Name, DisplayName, CommunityType, Status, FormationDate,
            FiscalYearStart, FiscalYearEnd, ContractStartDate, ContractEndDate,
            TaxID, TimeZone, MasterAssociation, IsSubAssociation,
            LastAuditDate, NextAuditDate, DataCompleteness, IsActive
          )
          OUTPUT INSERTED.ID
          VALUES (
            @Pcode, @Name, @DisplayName, @CommunityType, @Status, @FormationDate,
            @FiscalYearStart, @FiscalYearEnd, @ContractStartDate, @ContractEndDate,
            @TaxID, @TimeZone, @MasterAssociation, @IsSubAssociation,
            @LastAuditDate, @NextAuditDate, @DataCompleteness, 1
          )
        `);
      
      const newId = result.recordset[0].ID;
      return await this.getById(newId);
    } catch (error) {
      throw new Error(`Error creating community: ${error.message}`);
    }
  }

  // Update community
  static async update(id, communityData) {
    try {
      const pool = await getConnection();
      const request = pool.request().input('id', sql.Int, id);
      
      // Build dynamic SET clause based on provided fields
      const setClauses = [];
      
      // Only add fields that are actually provided in the data
      if (communityData.Pcode !== undefined) {
        request.input('Pcode', sql.VarChar(50), communityData.Pcode);
        setClauses.push('Pcode = @Pcode');
      }
      if (communityData.Name !== undefined) {
        request.input('Name', sql.NVarChar(255), communityData.Name);
        setClauses.push('Name = @Name');
      }
      if (communityData.DisplayName !== undefined) {
        request.input('DisplayName', sql.NVarChar(255), communityData.DisplayName);
        setClauses.push('DisplayName = @DisplayName');
      }
      if (communityData.CommunityType !== undefined) {
        request.input('CommunityType', sql.VarChar(50), communityData.CommunityType);
        setClauses.push('CommunityType = @CommunityType');
      }
      if (communityData.Status !== undefined) {
        request.input('Status', sql.VarChar(50), communityData.Status);
        setClauses.push('Status = @Status');
      }
      if (communityData.FormationDate !== undefined) {
        request.input('FormationDate', sql.Date, communityData.FormationDate);
        setClauses.push('FormationDate = @FormationDate');
      }
      if (communityData.FiscalYearStart !== undefined) {
        request.input('FiscalYearStart', sql.Date, communityData.FiscalYearStart);
        setClauses.push('FiscalYearStart = @FiscalYearStart');
      }
      if (communityData.FiscalYearEnd !== undefined) {
        request.input('FiscalYearEnd', sql.Date, communityData.FiscalYearEnd);
        setClauses.push('FiscalYearEnd = @FiscalYearEnd');
      }
      if (communityData.ContractStartDate !== undefined) {
        request.input('ContractStartDate', sql.Date, communityData.ContractStartDate);
        setClauses.push('ContractStartDate = @ContractStartDate');
      }
      if (communityData.ContractEndDate !== undefined) {
        request.input('ContractEndDate', sql.Date, communityData.ContractEndDate);
        setClauses.push('ContractEndDate = @ContractEndDate');
      }
      if (communityData.TaxID !== undefined) {
        request.input('TaxID', sql.VarChar(50), communityData.TaxID);
        setClauses.push('TaxID = @TaxID');
      }
      if (communityData.TimeZone !== undefined) {
        request.input('TimeZone', sql.VarChar(50), communityData.TimeZone);
        setClauses.push('TimeZone = @TimeZone');
      }
      if (communityData.MasterAssociation !== undefined) {
        request.input('MasterAssociation', sql.VarChar(255), communityData.MasterAssociation);
        setClauses.push('MasterAssociation = @MasterAssociation');
      }
      if (communityData.IsSubAssociation !== undefined) {
        request.input('IsSubAssociation', sql.Bit, communityData.IsSubAssociation);
        setClauses.push('IsSubAssociation = @IsSubAssociation');
      }
      if (communityData.LastAuditDate !== undefined) {
        request.input('LastAuditDate', sql.Date, communityData.LastAuditDate);
        setClauses.push('LastAuditDate = @LastAuditDate');
      }
      if (communityData.NextAuditDate !== undefined) {
        request.input('NextAuditDate', sql.Date, communityData.NextAuditDate);
        setClauses.push('NextAuditDate = @NextAuditDate');
      }
      if (communityData.DataCompleteness !== undefined) {
        request.input('DataCompleteness', sql.Float, communityData.DataCompleteness);
        setClauses.push('DataCompleteness = @DataCompleteness');
      }
      if (communityData.State !== undefined) {
        request.input('State', sql.VarChar(50), communityData.State);
        setClauses.push('State = @State');
      }
      if (communityData.City !== undefined) {
        request.input('City', sql.VarChar(100), communityData.City);
        setClauses.push('City = @City');
      }
      if (communityData.AddressLine1 !== undefined) {
        request.input('AddressLine1', sql.VarChar(255), communityData.AddressLine1);
        setClauses.push('AddressLine1 = @AddressLine1');
      }
      if (communityData.AddressLine2 !== undefined) {
        request.input('AddressLine2', sql.VarChar(255), communityData.AddressLine2);
        setClauses.push('AddressLine2 = @AddressLine2');
      }
      if (communityData.PostalCode !== undefined) {
        request.input('PostalCode', sql.VarChar(20), communityData.PostalCode);
        setClauses.push('PostalCode = @PostalCode');
      }
      if (communityData.Country !== undefined) {
        request.input('Country', sql.VarChar(50), communityData.Country);
        setClauses.push('Country = @Country');
      }
      
      // Build the final query
      const query = `
        UPDATE cor_Communities SET
          ${setClauses.join(', ')}
        WHERE ID = @id AND IsActive = 1
      `;
      
      await request.query(query);
      
      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating community: ${error.message}`);
    }
  }

  // Soft delete community
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE cor_Communities 
          SET IsActive = 0 
          WHERE ID = @id
        `);
      return { success: true, message: 'Community deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting community: ${error.message}`);
    }
  }

  // Get community with property count
  static async getCommunityWithStats(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            c.*,
            COUNT(p.ID) as PropertyCount
          FROM cor_Communities c
          LEFT JOIN cor_Properties p ON c.ID = p.CommunityID AND p.IsActive = 1
          WHERE c.ID = @id AND c.IsActive = 1
          GROUP BY c.ID, c.Pcode, c.Name, c.DisplayName, c.CommunityType, c.Status,
                   c.FormationDate, c.FiscalYearStart, c.FiscalYearEnd, c.ContractStartDate,
                   c.ContractEndDate, c.TaxID, c.TimeZone, c.MasterAssociation,
                   c.IsSubAssociation, c.LastAuditDate, c.NextAuditDate, c.DataCompleteness, c.IsActive,
                   c.State, c.City, c.AddressLine1, c.AddressLine2, c.PostalCode, c.Country, c.CreatedDate, c.LastUpdated
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching community stats: ${error.message}`);
    }
  }
}

module.exports = Community;