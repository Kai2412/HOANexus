const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

// Base board information fields
const BOARD_INFO_SELECT = `
  BoardInformationID,
  CommunityID,
  AnnualMeetingFrequency,
  RegularMeetingFrequency,
  BoardMembersRequired,
  Quorum,
  TermLimits,
  CreatedOn,
  CreatedBy,
  ModifiedOn,
  ModifiedBy,
  IsActive
`;

class BoardInformation {
  // Get board information by community ID
  static async getByCommunity(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT ${BOARD_INFO_SELECT}
          FROM dbo.cor_BoardInformation
          WHERE CommunityID = @communityId 
            AND IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'board information by community', error, 'BoardInformationModel');
      throw new Error('Error fetching board information: ' + error.message);
    }
  }

  // Get board information by ID
  static async getById(boardInformationId) {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input('boardInformationId', sql.UniqueIdentifier, boardInformationId)
        .query(`
          SELECT ${BOARD_INFO_SELECT}
          FROM dbo.cor_BoardInformation
          WHERE BoardInformationID = @boardInformationId 
            AND IsActive = 1
        `);
      return result.recordset[0] || null;
    } catch (error) {
      logger.databaseError('fetch', 'board information by ID', error, 'BoardInformationModel');
      throw new Error('Error fetching board information: ' + error.message);
    }
  }

  // Create new board information
  static async create(payload, createdBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Field configuration
      const fieldConfig = {
        CommunityID: { type: sql.UniqueIdentifier, required: true },
        AnnualMeetingFrequency: { type: sql.NVarChar(100) },
        RegularMeetingFrequency: { type: sql.NVarChar(100) },
        BoardMembersRequired: { type: sql.Int },
        Quorum: { type: sql.Int },
        TermLimits: { type: sql.NVarChar(200) }
      };

      // Build INSERT statement
      const fields = ['CommunityID', 'CreatedBy'];
      const values = ['@CommunityID', '@CreatedBy'];
      const inputs = [];

      // Add fields
      for (const [key, config] of Object.entries(fieldConfig)) {
        if (key === 'CommunityID' || key === 'CreatedBy') continue;
        
        if (payload[key] !== undefined && payload[key] !== null) {
          fields.push(key);
          values.push(`@${key}`);
          inputs.push({ name: key, type: config.type, value: payload[key] });
        }
      }

      // Add inputs
      request.input('CommunityID', sql.UniqueIdentifier, payload.CommunityID);
      request.input('CreatedBy', sql.UniqueIdentifier, createdBy);
      
      for (const input of inputs) {
        request.input(input.name, input.type, input.value);
      }

      const result = await request.query(`
        INSERT INTO dbo.cor_BoardInformation (${fields.join(', ')})
        OUTPUT INSERTED.BoardInformationID
        VALUES (${values.join(', ')})
      `);

      const newId = result.recordset[0].BoardInformationID;
      return await this.getById(newId);
    } catch (error) {
      logger.databaseError('create', 'board information', error, 'BoardInformationModel');
      throw new Error('Error creating board information: ' + error.message);
    }
  }

  // Update board information
  static async update(id, payload, modifiedBy = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Build UPDATE statement
      const updates = [];
      request.input('id', sql.UniqueIdentifier, id);
      request.input('ModifiedBy', sql.UniqueIdentifier, modifiedBy);

      // Field configuration
      const fieldConfig = {
        AnnualMeetingFrequency: sql.NVarChar(100),
        RegularMeetingFrequency: sql.NVarChar(100),
        BoardMembersRequired: sql.Int,
        Quorum: sql.Int,
        TermLimits: sql.NVarChar(200)
      };

      for (const [key, sqlType] of Object.entries(fieldConfig)) {
        if (payload[key] !== undefined) {
          updates.push(`${key} = @${key}`);
          request.input(key, sqlType, payload[key]);
        }
      }

      if (updates.length === 0) {
        return await this.getById(id);
      }

      updates.push('ModifiedOn = SYSUTCDATETIME()');
      updates.push('ModifiedBy = @ModifiedBy');

      await request.query(`
        UPDATE dbo.cor_BoardInformation 
        SET ${updates.join(', ')}
        WHERE BoardInformationID = @id AND IsActive = 1
      `);

      return await this.getById(id);
    } catch (error) {
      logger.databaseError('update', 'board information', error, 'BoardInformationModel');
      throw new Error('Error updating board information: ' + error.message);
    }
  }
}

module.exports = BoardInformation;

