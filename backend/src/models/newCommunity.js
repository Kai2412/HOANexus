const { sql, getConnection } = require('../config/database');

class NewCommunity {
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT
          CommunityID,
          PropertyCode,
          DisplayName,
          Active,
          ContractStart,
          ContractEnd,
          LegalName,
          Address,
          Address2,
          City,
          State,
          Zipcode,
          ThirdPartyIdentifier,
          Market,
          Office,
          Website,
          TaxID,
          StateTaxID,
          SOSFileNumber,
          TaxReturnType,
          ClientType,
          ServiceType,
          ManagementType,
          BuiltOutUnits,
          DevelopmentStage,
          CommunityStatus,
          AcquisitionType,
          PreferredContactInfo,
          CreatedOn,
          CreatedBy,
          ModifiedOn,
          ModifiedBy
        FROM dbo.cor_Communities
        WHERE Active = 1
        ORDER BY DisplayName
      `);

      return result.recordset;
    } catch (error) {
      throw new Error(`Error fetching new communities: ${error.message}`);
    }
  }

  static async getById(communityId) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('communityId', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT
            CommunityID,
            PropertyCode,
            DisplayName,
            Active,
            ContractStart,
            ContractEnd,
            LegalName,
            Address,
            Address2,
            City,
            State,
            Zipcode,
            ThirdPartyIdentifier,
            Market,
            Office,
            Website,
            TaxID,
            StateTaxID,
            SOSFileNumber,
            TaxReturnType,
            ClientType,
            ServiceType,
            ManagementType,
            BuiltOutUnits,
            DevelopmentStage,
            CommunityStatus,
            AcquisitionType,
            PreferredContactInfo,
            CreatedOn,
            CreatedBy,
            ModifiedOn,
            ModifiedBy
        FROM dbo.cor_Communities
          WHERE CommunityID = @communityId AND Active = 1
        `);

      return result.recordset[0];
    } catch (error) {
      throw new Error(`Error fetching new community ${communityId}: ${error.message}`);
    }
  }
}

module.exports = NewCommunity;

