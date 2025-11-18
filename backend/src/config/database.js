const sql = require('mssql');
const config = require('./index');
const { getDatabaseName } = require('../utils/databaseContext');

const baseDbConfig = {
  server: config.database.server,
  user: config.database.user,
  password: config.database.password,
  port: config.database.port,
  options: config.database.options,
  pool: config.database.pool
};

// Client database connection (default - for operational data)
const clientDbConfig = {
  ...baseDbConfig,
  database: config.database.database, // Client database (e.g., hoa_nexus_testclient)
};

// Master database connection (for user accounts and organizations)
const masterDbConfig = {
  ...baseDbConfig,
  database: process.env.DB_MASTER_DATABASE || 'hoa_nexus_master',
};

let clientPoolPromise;
let masterPoolPromise;
const clientPools = {}; // Cache for client database connections

/**
 * Get connection to the client database
 * @param {string} databaseName - Optional database name from user's organization.
 *                                If not provided, tries to get from request context,
 *                                then falls back to default from config.
 * @returns {Promise<ConnectionPool>} Database connection pool
 */
const getConnection = async (databaseName = null) => {
  try {
    // Priority: provided parameter > request context > default config
    const targetDatabase = databaseName || getDatabaseName() || clientDbConfig.database;
    
    // If using default database, use cached connection
    if (targetDatabase === clientDbConfig.database) {
      if (!clientPoolPromise) {
        clientPoolPromise = new sql.ConnectionPool(clientDbConfig).connect();
      }
      return await clientPoolPromise;
    }
    
    // Otherwise, use getClientConnection for organization-specific database
    return await getClientConnection(targetDatabase);
  } catch (error) {
    console.error('Client database connection failed:', error);
    throw error;
  }
};

/**
 * Get connection to the master database
 */
const getMasterConnection = async () => {
  try {
    if (!masterPoolPromise) {
      masterPoolPromise = new sql.ConnectionPool(masterDbConfig).connect();
    }
    return await masterPoolPromise;
  } catch (error) {
    console.error('Master database connection failed:', error);
    throw error;
  }
};

/**
 * Get connection to a specific client database by name
 * @param {string} databaseName - Name of the client database (e.g., 'hoa_nexus_testclient')
 */
const getClientConnection = async (databaseName) => {
  try {
    // If requesting the default client database, use the default connection
    if (databaseName === clientDbConfig.database) {
      return await getConnection();
    }

    // Check cache first
    if (clientPools[databaseName]) {
      return clientPools[databaseName];
    }

    // Create new connection for this client database
    const clientConfig = {
      ...baseDbConfig,
      database: databaseName,
    };

    const pool = await new sql.ConnectionPool(clientConfig).connect();
    clientPools[databaseName] = pool;
    return pool;
  } catch (error) {
    console.error(`Client database connection failed for ${databaseName}:`, error);
    throw error;
  }
};

module.exports = {
  sql,
  getConnection,
  getMasterConnection,
  getClientConnection
};