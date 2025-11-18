const jwt = require('jsonwebtoken');
const config = require('../config');
const { logger } = require('../utils/logger');
const { setDatabaseName } = require('../utils/databaseContext');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Access attempt without token', 'AuthMiddleware', { 
      url: req.originalUrl,
      method: req.method 
    });
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, config.auth.jwtSecret, (err, decoded) => {
    if (err) {
      logger.warn('Invalid token used', 'AuthMiddleware', { 
        url: req.originalUrl,
        method: req.method,
        error: err.message 
      });
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user info to request object
    req.user = decoded;
    
    // Set database name for this request (from JWT token)
    // This will be used by models to connect to the correct client database
    if (decoded.databaseName) {
      req.databaseName = decoded.databaseName;
      setDatabaseName(decoded.databaseName); // Set in context for models to use
    }
    
    logger.debug('Token verified successfully', 'AuthMiddleware', { 
      userId: decoded.userId,
      stakeholderId: decoded.stakeholderId,
      databaseName: decoded.databaseName
    });
    
    next();
  });
};

const requirePermission = (action, resource = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Basic permission check based on stakeholder type
    const hasPermission = checkUserPermission(req.user, action, resource);
    
    if (!hasPermission) {
      logger.warn('Permission denied', 'AuthMiddleware', {
        userId: req.user.userId,
        action,
        resource,
        userType: req.user.type,
        accessLevel: req.user.accessLevel
      });
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const checkUserPermission = (user, action, resource) => {
  // Permission logic matching frontend
  switch (user.type) {
    case 'Company Employee':
      if (user.accessLevel === 'Admin') return true;
      if (user.accessLevel === 'Full') {
        return action !== 'delete' && action !== 'admin';
      }
      if (user.accessLevel === 'Partial') {
        return action === 'view' || action === 'create';
      }
      return false;

    case 'Community Employee':
      if (user.accessLevel === 'Full') {
        return action !== 'delete' && action !== 'admin';
      }
      return action === 'view';

    case 'Board Member':
      if (user.subType === 'President') {
        return action !== 'admin';
      }
      return action === 'view' || action === 'create';

    case 'Resident':
      if (user.subType === 'Owner') {
        return action === 'view' || action === 'create';
      }
      return action === 'view';

    case 'Vendor':
      return action === 'view' && resource === 'own-tickets';

    default:
      return false;
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  checkUserPermission
};
