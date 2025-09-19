const { getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

const managementTeamController = {
  // Get management team for a specific community
  async getManagementTeam(req, res) {
    try {
      const { communityId } = req.params;
      
      logger.info('Getting management team for community', 'ManagementTeamController', { communityId });

      const pool = await getConnection();
      const request = pool.request();
      request.input('CommunityID', communityId);

      const result = await request.query(`
        SELECT 
          cca.ID,
          cca.StakeholderID,
          cca.RoleType,
          cca.RoleTitle,
          cca.StartDate,
          cca.EndDate,
          cca.IsActive,
          s.FirstName,
          s.LastName,
          s.Email,
          s.MobilePhone
        FROM cor_CompanyCommunityAssignments cca
        JOIN cor_Stakeholders s ON cca.StakeholderID = s.ID
        WHERE cca.CommunityID = @CommunityID 
          AND cca.IsActive = 1
          AND s.IsActive = 1
        ORDER BY 
          CASE cca.RoleType 
            WHEN 'Director' THEN 1 
            WHEN 'Manager' THEN 2 
            WHEN 'Assistant' THEN 3 
            ELSE 4 
          END,
          cca.StartDate ASC
      `);

      const teamMembers = result.recordset.map(row => ({
        id: row.ID,
        stakeholderId: row.StakeholderID,
        roleType: row.RoleType,
        roleTitle: row.RoleTitle,
        firstName: row.FirstName,
        lastName: row.LastName,
        email: row.Email,
        mobilePhone: row.MobilePhone,
        startDate: row.StartDate,
        endDate: row.EndDate,
        isActive: row.IsActive
      }));

      logger.info('Management team retrieved successfully', 'ManagementTeamController', { 
        communityId, 
        memberCount: teamMembers.length 
      });

      res.json({
        success: true,
        data: teamMembers
      });

    } catch (error) {
      logger.error('Error getting management team', 'ManagementTeamController', { communityId: req.params.communityId }, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch management team',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = managementTeamController;
