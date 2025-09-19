const { getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const ticketController = {
  // Get all tickets accessible to the logged-in user
  async getTickets(req, res) {
    try {
      const { stakeholderId } = req.user; // From JWT token
      const {
        page = 1,
        pageSize = 25,
        search,
        status,
        priority,
        category,
        sortBy = 'created',
        sortOrder = 'desc'
      } = req.query;

      logger.info('Getting tickets for user', 'TicketController', { 
        stakeholderId, 
        page, 
        pageSize,
        filters: { search, status, priority, category }
      });

      const pool = await getConnection();
      
      // First, get user's community assignments to determine what tickets they can see
      const userCommunitiesRequest = pool.request();
      userCommunitiesRequest.input('StakeholderID', stakeholderId);
      
      const userCommunitiesResult = await userCommunitiesRequest.query(`
        SELECT DISTINCT CommunityID 
        FROM cor_CompanyCommunityAssignments 
        WHERE StakeholderID = @StakeholderID AND IsActive = 1
      `);
      
      const userCommunityIds = userCommunitiesResult.recordset.map(row => row.CommunityID);
      
      // Build the main tickets query
      let whereConditions = [];
      let havingConditions = [];
      
      // User can see tickets they created OR tickets from their assigned communities
      if (userCommunityIds.length > 0) {
        whereConditions.push(`(t.CreatedBy = @StakeholderID OR t.CommunityID IN (${userCommunityIds.join(',')}))`);
      } else {
        // If no community assignments, only show tickets they created
        whereConditions.push('t.CreatedBy = @StakeholderID');
      }
      
      const request = pool.request();
      request.input('StakeholderID', stakeholderId);
      request.input('Offset', (page - 1) * pageSize);
      request.input('PageSize', parseInt(pageSize));
      
      // Add filter parameters
      if (search) {
        whereConditions.push(`(
          t.TicketNumber LIKE '%' + @Search + '%' OR
          t.Title LIKE '%' + @Search + '%' OR
          c.Name LIKE '%' + @Search + '%' OR
          c.PCode LIKE '%' + @Search + '%'
        )`);
        request.input('Search', search);
      }
      
      if (status && status !== 'All') {
        const statusArray = status.split(',');
        const statusConditions = statusArray.map((_, index) => {
          request.input(`Status${index}`, statusArray[index]);
          return `@Status${index}`;
        }).join(',');
        whereConditions.push(`t.Status IN (${statusConditions})`);
      }
      
      if (priority && priority !== 'All') {
        const priorityArray = priority.split(',');
        const priorityConditions = priorityArray.map((_, index) => {
          request.input(`Priority${index}`, priorityArray[index]);
          return `@Priority${index}`;
        }).join(',');
        whereConditions.push(`t.Priority IN (${priorityConditions})`);
      }
      
      if (category && category !== 'All') {
        const categoryArray = category.split(',');
        const categoryConditions = categoryArray.map((_, index) => {
          request.input(`Category${index}`, categoryArray[index]);
          return `@Category${index}`;
        }).join(',');
        whereConditions.push(`t.Category IN (${categoryConditions})`);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Determine sort column
      let sortColumn = 't.CreatedOn';
      switch (sortBy) {
        case 'modified': sortColumn = 't.ModifiedOn'; break;
        case 'priority': sortColumn = 't.Priority'; break;
        case 'status': sortColumn = 't.Status'; break;
        default: sortColumn = 't.CreatedOn';
      }
      
      const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
      
      // Main query - Union all ticket types
      const ticketsQuery = `
        WITH TicketUnion AS (
          -- Assignment Requests
          SELECT 
            'AssignmentRequest' as TicketType,
            ID,
            TicketNumber,
            'Assignment Request' as Title,
            'Management' as Category,
            Status,
            Priority,
            CreatedOn,
            ModifiedOn,
            CommunityID,
            CreatedBy,
            -- Assignment-specific metadata
            CONCAT('{"requestedRole":"', RequestedRoleTitle, '","effectiveDate":"', FORMAT(EffectiveDate, 'yyyy-MM-dd'), '"}') as Metadata
          FROM cor_AssignmentRequests
          
          -- Future ticket types will be added here with UNION ALL
          -- UNION ALL
          -- SELECT 'MaintenanceRequest' as TicketType, ...
        )
        SELECT 
          t.TicketType,
          t.ID,
          t.TicketNumber,
          t.Title,
          t.Category,
          t.Status,
          t.Priority,
          t.CreatedOn,
          t.ModifiedOn,
          t.CommunityID,
          t.CreatedBy,
          t.Metadata,
          c.Name as CommunityName,
          c.PCode as CommunityCode,
          creator.FirstName + ' ' + creator.LastName as CreatedByName,
          CASE WHEN t.CreatedBy = @StakeholderID THEN 1 ELSE 0 END as CreatedByMe,
          CASE WHEN t.CommunityID IN (${userCommunityIds.length > 0 ? userCommunityIds.join(',') : '0'}) THEN 1 ELSE 0 END as IsFromMyCommunity
        FROM TicketUnion t
        LEFT JOIN cor_Communities c ON t.CommunityID = c.ID
        LEFT JOIN cor_Stakeholders creator ON t.CreatedBy = creator.ID
        ${whereClause}
        ${orderClause}
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY
      `;
      
      // Get total count for pagination
      const countQuery = `
        WITH TicketUnion AS (
          SELECT 
            'AssignmentRequest' as TicketType,
            ID, TicketNumber, 'Assignment Request' as Title, 'Management' as Category,
            Status, Priority, CreatedOn, ModifiedOn, CommunityID, CreatedBy,
            '' as Metadata
          FROM cor_AssignmentRequests
        )
        SELECT COUNT(*) as TotalCount
        FROM TicketUnion t
        LEFT JOIN cor_Communities c ON t.CommunityID = c.ID
        LEFT JOIN cor_Stakeholders creator ON t.CreatedBy = creator.ID
        ${whereClause}
      `;
      
      // Execute both queries
      const [ticketsResult, countResult] = await Promise.all([
        request.query(ticketsQuery),
        pool.request().input('StakeholderID', stakeholderId).query(countQuery)
      ]);
      
      const tickets = ticketsResult.recordset.map(row => ({
        id: row.ID,
        ticketNumber: row.TicketNumber,
        ticketType: row.TicketType,
        type: row.Title,
        category: row.Category,
        title: `${row.Title} - ${row.CommunityName}`,
        status: row.Status,
        priority: row.Priority,
        createdOn: row.CreatedOn,
        modifiedOn: row.ModifiedOn,
        communityName: row.CommunityName,
        communityCode: row.CommunityCode,
        createdByMe: !!row.CreatedByMe,
        isFromMyCommunity: !!row.IsFromMyCommunity,
        metadata: row.Metadata ? JSON.parse(row.Metadata) : null
      }));
      
      const totalCount = countResult.recordset[0].TotalCount;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      logger.info('Tickets retrieved successfully', 'TicketController', {
        stakeholderId,
        ticketCount: tickets.length,
        totalCount,
        userCommunities: userCommunityIds.length
      });
      
      res.json({
        success: true,
        tickets,
        totalCount,
        pageCount: totalPages,
        currentPage: parseInt(page),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      });

    } catch (error) {
      logger.error('Error getting tickets', 'TicketController', { stakeholderId: req.user?.stakeholderId }, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get specific ticket by ID
  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const { stakeholderId } = req.user;
      
      logger.info('Getting ticket by ID', 'TicketController', { ticketId: id, stakeholderId });
      
      const pool = await getConnection();
      const request = pool.request();
      request.input('TicketID', id);
      request.input('StakeholderID', stakeholderId);
      
      // Get user's community assignments
      const userCommunitiesResult = await request.query(`
        SELECT DISTINCT CommunityID 
        FROM cor_CompanyCommunityAssignments 
        WHERE StakeholderID = @StakeholderID AND IsActive = 1
      `);
      
      const userCommunityIds = userCommunitiesResult.recordset.map(row => row.CommunityID);
      
      // Get ticket details (currently only assignment requests)
      const ticketRequest = pool.request();
      ticketRequest.input('TicketID', id);
      ticketRequest.input('StakeholderID', stakeholderId);
      
      const ticketResult = await ticketRequest.query(`
        SELECT 
          ar.*,
          c.Name as CommunityName,
          c.PCode as CommunityCode,
          creator.FirstName + ' ' + creator.LastName as CreatedByName,
          modifier.FirstName + ' ' + modifier.LastName as ModifiedByName
        FROM cor_AssignmentRequests ar
        LEFT JOIN cor_Communities c ON ar.CommunityID = c.ID
        LEFT JOIN cor_Stakeholders creator ON ar.CreatedBy = creator.ID
        LEFT JOIN cor_Stakeholders modifier ON ar.ModifiedBy = modifier.ID
        WHERE ar.ID = @TicketID
          AND (ar.CreatedBy = @StakeholderID OR ar.CommunityID IN (${userCommunityIds.length > 0 ? userCommunityIds.join(',') : '0'}))
      `);
      
      if (ticketResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found or access denied'
        });
      }
      
      // Get ticket notes
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
      
      const ticket = ticketResult.recordset[0];
      ticket.notes = notesResult.recordset;
      ticket.metadata = {
        requestedRole: ticket.RequestedRoleTitle,
        effectiveDate: ticket.EffectiveDate
      };
      
      res.json({
        success: true,
        data: ticket
      });

    } catch (error) {
      logger.error('Error getting ticket by ID', 'TicketController', { ticketId: req.params.id }, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket details'
      });
    }
  }
};

module.exports = ticketController;
