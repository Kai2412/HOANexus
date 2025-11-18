/**
 * Database Context Utility
 * Provides request-scoped database name for multi-tenant architecture
 */

// Store current request's database name
// This is set by middleware and used by models
let currentDatabaseName = null;

/**
 * Set the database name for the current request context
 * Called by middleware after authentication
 * @param {string} databaseName - Database name from user's organization
 */
function setDatabaseName(databaseName) {
  currentDatabaseName = databaseName;
}

/**
 * Get the database name for the current request context
 * Returns null if not set (will use default from config)
 * @returns {string|null} Database name or null
 */
function getDatabaseName() {
  return currentDatabaseName;
}

/**
 * Clear the database name (for cleanup)
 */
function clearDatabaseName() {
  currentDatabaseName = null;
}

module.exports = {
  setDatabaseName,
  getDatabaseName,
  clearDatabaseName
};

