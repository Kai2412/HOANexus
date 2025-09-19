const { getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const assignmentController = {
  // Create new assignment request ticket
  async createAssignmentRequest(req, res) {
    try {
      logger.info('Creating assignment request', 'AssignmentController', { body: req.body });
      
      const {
        communityID,
        requestedRoleType,
        requestedRoleTitle,
        effectiveDate,
        endDate,
        replacingStakeholderID,
        priority,
        notes,
        createdBy
      } = req.body;

      // Validate required fields
      if (!communityID || !requestedRoleType || !requestedRoleTitle || !effectiveDate || !notes || !createdBy) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: communityID, requestedRoleType, requestedRoleTitle, effectiveDate, notes, createdBy'
        });
      }

      // Validate role type
      const validRoleTypes = ['Manager', 'Director', 'Assistant'];
      if (!validRoleTypes.includes(requestedRoleType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role type. Must be one of: Manager, Director, Assistant'
        });
      }

      // Validate priority
      const validPriorities = ['Normal', 'Urgent', 'Emergency'];
      if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority. Must be one of: Normal, Urgent, Emergency'
        });
      }

      const pool = await getConnection();
      const transaction = pool.transaction();

      try {
        await transaction.begin();

        // Insert assignment request
        const insertRequest = await transaction.request();
        insertRequest.input('CommunityID', communityID);
        insertRequest.input('RequestedRoleType', requestedRoleType);
        insertRequest.input('RequestedRoleTitle', requestedRoleTitle);
        insertRequest.input('EffectiveDate', effectiveDate);
        insertRequest.input('EndDate', endDate || null);
        insertRequest.input('ReplacingStakeholderID', replacingStakeholderID || null);
        insertRequest.input('Priority', priority || 'Normal');
        insertRequest.input('CreatedBy', createdBy);
        insertRequest.input('ModifiedBy', createdBy);

        const result = await insertRequest.query(`
          INSERT INTO cor_AssignmentRequests (
            CommunityID, RequestedRoleType, RequestedRoleTitle, EffectiveDate, EndDate,
            ReplacingStakeholderID, Priority, CreatedBy, ModifiedBy
          )
          OUTPUT INSERTED.ID, INSERTED.TicketNumber
          VALUES (
            @CommunityID, @RequestedRoleType, @RequestedRoleTitle, @EffectiveDate, @EndDate,
            @ReplacingStakeholderID, @Priority, @CreatedBy, @ModifiedBy
          )
        `);

        const newTicket = result.recordset[0];
        const ticketID = newTicket.ID;
        const ticketNumber = newTicket.TicketNumber;

        // Insert initial notes as first note
        const insertNote = await transaction.request();
        insertNote.input('TicketType', 'AssignmentRequest');
        insertNote.input('TicketID', ticketID);
        insertNote.input('NoteText', notes);
        insertNote.input('IsInternal', false); // Initial notes are public
        insertNote.input('CreatedBy', createdBy);

        await insertNote.query(`
          INSERT INTO cor_TicketNotes (TicketType, TicketID, NoteText, IsInternal, CreatedBy)
          VALUES (@TicketType, @TicketID, @NoteText, @IsInternal, @CreatedBy)
        `);

        await transaction.commit();

        logger.info('Assignment request created successfully', 'AssignmentController', { 
          ticketID, 
          ticketNumber, 
          communityID, 
          requestedRoleType 
        });

        res.status(201).json({
          success: true,
          message: 'Assignment request created successfully',
          data: {
            id: ticketID,
            ticketNumber: ticketNumber,
            status: 'Pending',
            priority: priority || 'Normal'
          }
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      logger.error('Error creating assignment request', 'AssignmentController', null, error);
      res.status(500).json({
        success: false,
        message: 'Failed to create assignment request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get assignment requests for a user
  async getAssignmentRequests(req, res) {
    try {
      const { createdBy, status } = req.query;
      
      const pool = await getConnection();
      const request = pool.request();
      
      let whereClause = 'WHERE 1=1';
      
      if (createdBy) {
        request.input('CreatedBy', createdBy);
        whereClause += ' AND ar.CreatedBy = @CreatedBy';
      }
      
      if (status) {
        request.input('Status', status);
        whereClause += ' AND ar.Status = @Status';
      }

      const result = await request.query(`
        SELECT 
          ar.ID,
          ar.TicketNumber,
          ar.Status,
          ar.Priority,
          ar.CreatedOn,
          ar.ModifiedOn,
          ar.CommunityID,
          ar.RequestedRoleType,
          ar.RequestedRoleTitle,
          ar.EffectiveDate,
          ar.EndDate,
          ar.ReplacingStakeholderID,
          c.PCode as CommunityCode,
          c.Name as CommunityName,
          s.FirstName + ' ' + s.LastName as CreatedByName
        FROM cor_AssignmentRequests ar
        LEFT JOIN cor_Communities c ON ar.CommunityID = c.ID
        LEFT JOIN cor_Stakeholders s ON ar.CreatedBy = s.ID
        ${whereClause}
        ORDER BY ar.CreatedOn DESC
      `);

      res.json({
        success: true,
        data: result.recordset
      });

    } catch (error) {
      logger.error('Error fetching assignment requests', 'AssignmentController', null, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment requests',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get assignment request by ID with notes
  async getAssignmentRequestById(req, res) {
    try {
      const { id } = req.params;
      
      const pool = await getConnection();
      const request = pool.request();
      request.input('ID', id);

      // Get assignment request details
      const assignmentResult = await request.query(`
        SELECT 
          ar.*,
          c.PCode as CommunityCode,
          c.Name as CommunityName,
          creator.FirstName + ' ' + creator.LastName as CreatedByName,
          modifier.FirstName + ' ' + modifier.LastName as ModifiedByName,
          replacing.FirstName + ' ' + replacing.LastName as ReplacingStakeholderName
        FROM cor_AssignmentRequests ar
        LEFT JOIN cor_Communities c ON ar.CommunityID = c.ID
        LEFT JOIN cor_Stakeholders creator ON ar.CreatedBy = creator.ID
        LEFT JOIN cor_Stakeholders modifier ON ar.ModifiedBy = modifier.ID
        LEFT JOIN cor_Stakeholders replacing ON ar.ReplacingStakeholderID = replacing.ID
        WHERE ar.ID = @ID
      `);

      if (assignmentResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Assignment request not found'
        });
      }

      // Get notes for this ticket
      const notesRequest = pool.request();
      notesRequest.input('TicketID', id);
      
      const notesResult = await notesRequest.query(`
        SELECT 
          tn.ID,
          tn.NoteText,
          tn.IsInternal,
          tn.CreatedOn,
          s.FirstName + ' ' + s.LastName as CreatedByName
        FROM cor_TicketNotes tn
        LEFT JOIN cor_Stakeholders s ON tn.CreatedBy = s.ID
        WHERE tn.TicketType = 'AssignmentRequest' AND tn.TicketID = @TicketID
        ORDER BY tn.CreatedOn ASC
      `);

      const assignmentData = assignmentResult.recordset[0];
      assignmentData.notes = notesResult.recordset;

      res.json({
        success: true,
        data: assignmentData
      });

    } catch (error) {
      logger.error('Error fetching assignment request by ID', 'AssignmentController', null, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = assignmentController;
