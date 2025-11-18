const { sql, getMasterConnection } = require('../config/database');
const config = require('../config');

/**
 * Get OrganizationID from master database based on database name
 * @param {string} databaseName - Name of the client database (e.g., 'hoa_nexus_testclient')
 * @returns {Promise<string|null>} OrganizationID GUID or null
 */
async function getOrganizationIdByDatabaseName(databaseName) {
  try {
    const pool = await getMasterConnection();
    const result = await pool.request()
      .input('DatabaseName', sql.NVarChar(100), databaseName)
      .query(`
        SELECT OrganizationID
        FROM dbo.cor_Organizations
        WHERE DatabaseName = @DatabaseName AND IsActive = 1
      `);
    
    if (result.recordset.length > 0) {
      return result.recordset[0].OrganizationID;
    }
    
    return null;
  } catch (error) {
    throw new Error(`Error getting organization ID: ${error.message}`);
  }
}

/**
 * Get OrganizationID for the current client database
 * Uses the default database name from config
 * @returns {Promise<string|null>} OrganizationID GUID or null
 */
async function getCurrentOrganizationId() {
  const databaseName = config.database.database;
  return await getOrganizationIdByDatabaseName(databaseName);
}

module.exports = {
  getOrganizationIdByDatabaseName,
  getCurrentOrganizationId
};

