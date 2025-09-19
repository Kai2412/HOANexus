const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

// Get all amenities for a community with pagination and filtering
const getAmenities = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status = 'Available',
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        a.AmenityID,
        a.Name,
        a.AmenityType,
        a.Status,
        a.Description,
        a.Location,
        a.Capacity,
        a.IsReservable,
        a.RequiresApproval,
        a.ReservationFee,
        a.CreatedDate,
        a.ModifiedDate,
        c.Name as CommunityName,
        c.Pcode as CommunityCode
      FROM op_Amenities a
      INNER JOIN cor_Communities c ON a.CommunityID = c.ID
      WHERE a.CommunityID = @communityId
    `;

    const pool = await getConnection();
    const request = pool.request();
    request.input('communityId', sql.Int, parseInt(communityId));
    request.input('offset', sql.Int, parseInt(offset));
    request.input('limit', sql.Int, parseInt(limit));

    // Add filters
    if (type) {
      query += ` AND a.AmenityType = @type`;
      request.input('type', sql.NVarChar, type);
    }

    if (status) {
      query += ` AND a.Status = @status`;
      request.input('status', sql.NVarChar, status);
    }

    if (search) {
      query += ` AND (a.Name LIKE @search OR a.Description LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    // Add pagination
    query += `
      ORDER BY a.Name
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);

    // For each amenity, fetch its features and schedules
    const amenitiesWithDetails = await Promise.all(
      result.recordset.map(async (amenity) => {
        // Fetch features
        const featuresRequest = pool.request();
        featuresRequest.input('amenityId', sql.Int, amenity.AmenityID);
        const featuresQuery = `
          SELECT FeatureID, FeatureName, Description, Status
          FROM op_AmenityFeatures
          WHERE AmenityID = @amenityId
          ORDER BY FeatureName
        `;
        const featuresResult = await featuresRequest.query(featuresQuery);

        // Fetch schedules
        const schedulesRequest = pool.request();
        schedulesRequest.input('amenityId', sql.Int, amenity.AmenityID);
        const schedulesQuery = `
          SELECT DayOfWeek, OpenTime, CloseTime, IsOpen
          FROM op_AmenitySchedules
          WHERE AmenityID = @amenityId
          AND (EffectiveEndDate IS NULL OR EffectiveEndDate > GETDATE())
          ORDER BY DayOfWeek
        `;
        const schedulesResult = await schedulesRequest.query(schedulesQuery);

        return {
          ...amenity,
          features: featuresResult.recordset,
          schedule: schedulesResult.recordset
        };
      })
    );

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM op_Amenities a
      WHERE a.CommunityID = @communityId
    `;

    const countRequest = pool.request();
    countRequest.input('communityId', sql.Int, parseInt(communityId));

    if (type) {
      countQuery += ` AND a.AmenityType = @type`;
      countRequest.input('type', sql.NVarChar, type);
    }

    if (status) {
      countQuery += ` AND a.Status = @status`;
      countRequest.input('status', sql.NVarChar, status);
    }

    if (search) {
      countQuery += ` AND (a.Name LIKE @search OR a.Description LIKE @search)`;
      countRequest.input('search', sql.NVarChar, `%${search}%`);
    }

    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      data: amenitiesWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.databaseError('fetch', 'amenities', error, 'AmenityController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenities',
      error: error.message
    });
  }
};

// Get a single amenity by ID
const getAmenityById = async (req, res) => {
  try {
    const { amenityId } = req.params;

    const pool = await getConnection();
    const request = pool.request();
    request.input('amenityId', sql.Int, parseInt(amenityId));

    const query = `
      SELECT 
        a.AmenityID,
        a.Name,
        a.AmenityType,
        a.Status,
        a.Description,
        a.Location,
        a.Capacity,
        a.IsReservable,
        a.RequiresApproval,
        a.ReservationFee,
        a.CreatedDate,
        a.ModifiedDate,
        c.Name as CommunityName,
        c.Pcode as CommunityCode,
        c.ID as CommunityID
      FROM op_Amenities a
      INNER JOIN cor_Communities c ON a.CommunityID = c.ID
      WHERE a.AmenityID = @amenityId
    `;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    logger.databaseError('fetch', 'amenity', error, 'AmenityController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenity',
      error: error.message
    });
  }
};

// Get amenity types from configuration
const getAmenityTypes = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const query = `
      SELECT TypeName, Description, IconClass, DefaultCapacity
      FROM cfg_AmenityTypes
      WHERE IsActive = 1
      ORDER BY TypeName
    `;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    logger.databaseError('fetch', 'amenity types', error, 'AmenityController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenity types',
      error: error.message
    });
  }
};

// Get status types for amenities
const getStatusTypes = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    const query = `
      SELECT StatusName, Description, ColorCode
      FROM cfg_StatusTypes
      WHERE Category IN ('General', 'Amenities') AND IsActive = 1
      ORDER BY StatusName
    `;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    logger.databaseError('fetch', 'status types', error, 'AmenityController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status types',
      error: error.message
    });
  }
};

module.exports = {
  getAmenities,
  getAmenityById,
  getAmenityTypes,
  getStatusTypes
};
