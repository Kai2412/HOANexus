const sql = require('mssql');
const config = require('./index');

const dbConfig = {
  server: config.database.server,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  port: config.database.port,
  options: config.database.options,
  pool: config.database.pool
};

let poolPromise;

const getConnection = async () => {
  try {
    if (!poolPromise) {
      poolPromise = new sql.ConnectionPool(dbConfig).connect();
    }
    return await poolPromise;
  } catch (error) {
    // Note: Logger not available here yet, so we'll use console for now
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = {
  sql,
  getConnection
};