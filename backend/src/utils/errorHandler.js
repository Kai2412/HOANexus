// HOA Nexus Backend Error Handling Utility

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// Operational errors - expected errors that don't require immediate attention
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, true);
    this.details = details;
    this.type = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource, identifier) {
    super(`${resource} not found with identifier: ${identifier}`, 404, true);
    this.resource = resource;
    this.identifier = identifier;
    this.type = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, true);
    this.details = details;
    this.type = 'ConflictError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, true);
    this.type = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403, true);
    this.type = 'ForbiddenError';
  }
}

// Database errors
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(`Database error: ${message}`, 500, false);
    this.originalError = originalError;
    this.type = 'DatabaseError';
  }
}

class ConnectionError extends AppError {
  constructor(message, originalError = null) {
    super(`Database connection error: ${message}`, 503, false);
    this.originalError = originalError;
    this.type = 'ConnectionError';
  }
}

// Standardized error response format
const createErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: error.message,
      type: error.type || 'AppError',
      statusCode: error.statusCode || 500,
      timestamp: error.timestamp || new Date().toISOString(),
    }
  };

  // Add additional details for operational errors
  if (error.isOperational && error.details) {
    response.error.details = error.details;
  }

  // Add resource info for not found errors
  if (error.type === 'NotFoundError') {
    response.error.resource = error.resource;
    response.error.identifier = error.identifier;
  }

  // Add stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  // Log the error
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle known error types
  if (error instanceof AppError) {
    const response = createErrorResponse(error, process.env.NODE_ENV === 'development');
    return res.status(error.statusCode).json(response);
  }

  // Handle SQL Server specific errors
  if (error.code && error.code.startsWith('SQL')) {
    const dbError = new DatabaseError('Database operation failed', error);
    const response = createErrorResponse(dbError, process.env.NODE_ENV === 'development');
    return res.status(500).json(response);
  }

  // Handle validation errors from express-validator
  if (error.type === 'entity.parse.failed') {
    const validationError = new ValidationError('Invalid JSON payload');
    const response = createErrorResponse(validationError);
    return res.status(400).json(response);
  }

  // Handle unknown errors
  const unknownError = new AppError('Internal server error', 500, false);
  const response = createErrorResponse(unknownError, process.env.NODE_ENV === 'development');
  
  res.status(500).json(response);
};

// Async error wrapper for controllers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
const handleValidationError = (validationResult) => {
  if (!validationResult.isEmpty()) {
    const errors = validationResult.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));
    
    throw new ValidationError('Validation failed', errors);
  }
};

// Database error handler
const handleDatabaseError = (error, operation, entity) => {
  if (error.code === 'ER_DUP_ENTRY' || error.number === 2627) {
    throw new ConflictError(`${entity} already exists`);
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW' || error.number === 547) {
    throw new ValidationError(`Referenced ${entity} does not exist`);
  }
  
  throw new DatabaseError(`${operation} failed for ${entity}`, error);
};

// Not found handler
const handleNotFound = (entity, identifier) => {
  throw new NotFoundError(entity, identifier);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
  ConnectionError,
  createErrorResponse,
  globalErrorHandler,
  asyncHandler,
  handleValidationError,
  handleDatabaseError,
  handleNotFound
};
