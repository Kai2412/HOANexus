const { sql, getConnection } = require('../config/database');
const { logger } = require('../utils/logger');

class Property {
  // Get all properties
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT 
          ID,
          CommunityID,
          AddressLine1,
          AddressLine2,
          City,
          State,
          PostalCode,
          Country,
          Latitude,
          Longitude,
          PropertyType,
          SquareFootage,
          Bedrooms,
          Bathrooms,
          YearBuilt,
          LotSize,
          ParcelID,
          AssessmentPercentage,
          IsActiveDevelopment,
          VotingInterest,
          Status,
          IsActive
        FROM cor_Properties 
        WHERE IsActive = 1
        ORDER BY AddressLine1
      `);
      return result.recordset;
    } catch (error) {
      logger.databaseError('fetch', 'properties', error, 'PropertyModel');
      throw new Error('Error fetching properties: ' + error.message);
    }
  }

  // Get property by ID
  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            ID,
            CommunityID,
            AddressLine1,
            AddressLine2,
            City,
            State,
            PostalCode,
            Country,
            Latitude,
            Longitude,
            PropertyType,
            SquareFootage,
            Bedrooms,
            Bathrooms,
            YearBuilt,
            LotSize,
            ParcelID,
            AssessmentPercentage,
            IsActiveDevelopment,
            VotingInterest,
            Status,
            IsActive
          FROM cor_Properties 
          WHERE ID = @id AND IsActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      logger.databaseError('fetch', 'property by ID', error, 'PropertyModel');
      throw new Error('Error fetching property: ' + error.message);
    }
  }

  // Get properties by community
  static async getByCommunity(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('communityId', sql.Int, communityId)
        .query(`
          SELECT 
            ID,
            CommunityID,
            AddressLine1,
            AddressLine2,
            City,
            State,
            PostalCode,
            Country,
            Latitude,
            Longitude,
            PropertyType,
            SquareFootage,
            Bedrooms,
            Bathrooms,
            YearBuilt,
            LotSize,
            ParcelID,
            AssessmentPercentage,
            IsActiveDevelopment,
            VotingInterest,
            Status,
            IsActive
          FROM cor_Properties 
          WHERE CommunityID = @communityId AND IsActive = 1
          ORDER BY AddressLine1
        `);
      return result.recordset;
    } catch (error) {
      logger.databaseError('fetch', 'properties by community', error, 'PropertyModel');
      throw new Error('Error fetching properties by community: ' + error.message);
    }
  }

  // Create new property
  static async create(propertyData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('CommunityID', sql.Int, propertyData.CommunityID)
        .input('AddressLine1', sql.NVarChar(255), propertyData.AddressLine1)
        .input('AddressLine2', sql.NVarChar(255), propertyData.AddressLine2)
        .input('City', sql.NVarChar(100), propertyData.City)
        .input('State', sql.NVarChar(50), propertyData.State)
        .input('PostalCode', sql.VarChar(20), propertyData.PostalCode)
        .input('Country', sql.VarChar(50), propertyData.Country || 'USA')
        .input('Latitude', sql.Decimal(9, 6), propertyData.Latitude)
        .input('Longitude', sql.Decimal(9, 6), propertyData.Longitude)
        .input('PropertyType', sql.VarChar(50), propertyData.PropertyType)
        .input('SquareFootage', sql.Int, propertyData.SquareFootage)
        .input('Bedrooms', sql.Int, propertyData.Bedrooms)
        .input('Bathrooms', sql.Float, propertyData.Bathrooms)
        .input('YearBuilt', sql.Int, propertyData.YearBuilt)
        .input('LotSize', sql.Float, propertyData.LotSize)
        .input('ParcelID', sql.NVarChar(100), propertyData.ParcelID)
        .input('AssessmentPercentage', sql.Float, propertyData.AssessmentPercentage || 1.0)
        .input('IsActiveDevelopment', sql.Bit, propertyData.IsActiveDevelopment || 0)
        .input('VotingInterest', sql.Float, propertyData.VotingInterest || 1.0)
        .input('Status', sql.VarChar(50), propertyData.Status || 'Occupied')
        .query(`
          INSERT INTO cor_Properties (
            CommunityID, AddressLine1, AddressLine2, City, State, PostalCode, Country,
            Latitude, Longitude, PropertyType, SquareFootage, Bedrooms, Bathrooms,
            YearBuilt, LotSize, ParcelID, AssessmentPercentage, IsActiveDevelopment,
            VotingInterest, Status, IsActive
          )
          OUTPUT INSERTED.*
          VALUES (
            @CommunityID, @AddressLine1, @AddressLine2, @City, @State, @PostalCode, @Country,
            @Latitude, @Longitude, @PropertyType, @SquareFootage, @Bedrooms, @Bathrooms,
            @YearBuilt, @LotSize, @ParcelID, @AssessmentPercentage, @IsActiveDevelopment,
            @VotingInterest, @Status, 1
          )
        `);
      return result.recordset[0];
    } catch (error) {
      logger.databaseError('create', 'property', error, 'PropertyModel');
      throw new Error('Error creating property: ' + error.message);
    }
  }

  // Update property
  static async update(id, propertyData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('CommunityID', sql.Int, propertyData.CommunityID)
        .input('AddressLine1', sql.NVarChar(255), propertyData.AddressLine1)
        .input('AddressLine2', sql.NVarChar(255), propertyData.AddressLine2)
        .input('City', sql.NVarChar(100), propertyData.City)
        .input('State', sql.NVarChar(50), propertyData.State)
        .input('PostalCode', sql.VarChar(20), propertyData.PostalCode)
        .input('Country', sql.VarChar(50), propertyData.Country)
        .input('Latitude', sql.Decimal(9, 6), propertyData.Latitude)
        .input('Longitude', sql.Decimal(9, 6), propertyData.Longitude)
        .input('PropertyType', sql.VarChar(50), propertyData.PropertyType)
        .input('SquareFootage', sql.Int, propertyData.SquareFootage)
        .input('Bedrooms', sql.Int, propertyData.Bedrooms)
        .input('Bathrooms', sql.Float, propertyData.Bathrooms)
        .input('YearBuilt', sql.Int, propertyData.YearBuilt)
        .input('LotSize', sql.Float, propertyData.LotSize)
        .input('ParcelID', sql.NVarChar(100), propertyData.ParcelID)
        .input('AssessmentPercentage', sql.Float, propertyData.AssessmentPercentage)
        .input('IsActiveDevelopment', sql.Bit, propertyData.IsActiveDevelopment)
        .input('VotingInterest', sql.Float, propertyData.VotingInterest)
        .input('Status', sql.VarChar(50), propertyData.Status)
        .query(`
          UPDATE cor_Properties 
          SET 
            CommunityID = COALESCE(@CommunityID, CommunityID),
            AddressLine1 = COALESCE(@AddressLine1, AddressLine1),
            AddressLine2 = COALESCE(@AddressLine2, AddressLine2),
            City = COALESCE(@City, City),
            State = COALESCE(@State, State),
            PostalCode = COALESCE(@PostalCode, PostalCode),
            Country = COALESCE(@Country, Country),
            Latitude = COALESCE(@Latitude, Latitude),
            Longitude = COALESCE(@Longitude, Longitude),
            PropertyType = COALESCE(@PropertyType, PropertyType),
            SquareFootage = COALESCE(@SquareFootage, SquareFootage),
            Bedrooms = COALESCE(@Bedrooms, Bedrooms),
            Bathrooms = COALESCE(@Bathrooms, Bathrooms),
            YearBuilt = COALESCE(@YearBuilt, YearBuilt),
            LotSize = COALESCE(@LotSize, LotSize),
            ParcelID = COALESCE(@ParcelID, ParcelID),
            AssessmentPercentage = COALESCE(@AssessmentPercentage, AssessmentPercentage),
            IsActiveDevelopment = COALESCE(@IsActiveDevelopment, IsActiveDevelopment),
            VotingInterest = COALESCE(@VotingInterest, VotingInterest),
            Status = COALESCE(@Status, Status)
          OUTPUT INSERTED.*
          WHERE ID = @id AND IsActive = 1
        `);
      return result.recordset[0];
    } catch (error) {
      logger.databaseError('update', 'property', error, 'PropertyModel');
      throw new Error('Error updating property: ' + error.message);
    }
  }

  // Soft delete property
  static async delete(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE cor_Properties 
          SET IsActive = 0
          WHERE ID = @id
        `);
      return { success: true };
    } catch (error) {
      logger.databaseError('delete', 'property', error, 'PropertyModel');
      throw new Error('Error deleting property: ' + error.message);
    }
  }

  // Get property with stakeholders
  static async getPropertyWithStakeholders(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            p.*,
            s.ID as StakeholderID,
            s.Type as StakeholderType,
            s.FirstName,
            s.LastName,
            s.Email,
            s.Phone
          FROM cor_Properties p
          LEFT JOIN cor_Property_Stakeholders ps ON p.ID = ps.PropertyID
          LEFT JOIN cor_Stakeholders s ON ps.StakeholderID = s.ID AND s.IsActive = 1
          WHERE p.ID = @id AND p.IsActive = 1
        `);
      return result.recordset;
    } catch (error) {
      logger.databaseError('fetch', 'property with stakeholders', error, 'PropertyModel');
      throw new Error('Error fetching property with stakeholders: ' + error.message);
    }
  }
}

module.exports = Property;