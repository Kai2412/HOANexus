// HOA Nexus Backend Logging Service
const config = require('../config');

class Logger {
  constructor() {
    this.isDevelopment = config.server.environment === 'development';
    this.isProduction = config.server.environment === 'production';
    this.logLevel = config.logging.level || 'info';
  }

  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    return levels[level] <= levels[this.logLevel];
  }

  formatMessage(level, message, context = null, data = null) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();
    const contextStr = context ? `[${context}]` : '';
    
    return `${timestamp} ${levelUpper} ${contextStr} ${message}`;
  }

  log(level, message, context = null, data = null, error = null) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, data || '', error || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
    }

    // In development, provide additional context
    if (this.isDevelopment && (data || error)) {
      console.group(`🔍 ${context || 'Application'}`);
      if (data) console.log('Data:', data);
      if (error) {
        console.error('Error:', error);
        if (error.stack) console.trace('Stack trace:');
      }
      console.groupEnd();
    }
  }

  error(message, context = null, data = null, error = null) {
    this.log('error', message, context, data, error);
  }

  warn(message, context = null, data = null) {
    this.log('warn', message, context, data);
  }

  info(message, context = null, data = null) {
    this.log('info', message, context, data);
  }

  debug(message, context = null, data = null) {
    this.log('debug', message, context, data);
  }

  // Convenience methods for common logging patterns
  apiRequest(method, url, context = null, data = null) {
    this.info(`${method} ${url}`, context, data);
  }

  apiResponse(method, url, statusCode, duration, context = null) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${url} - ${statusCode} (${duration}ms)`, context);
  }

  databaseOperation(operation, table, context = null, data = null) {
    this.debug(`Database ${operation} on ${table}`, context, data);
  }

  databaseError(operation, table, error, context = null) {
    this.error(`Database ${operation} failed on ${table}`, context, null, error);
  }

  startup(message, data = null) {
    this.info(`🚀 ${message}`, 'Startup', data);
  }

  configuration(configData) {
    this.info('Configuration loaded', 'Startup', configData);
  }

  security(event, details = null, context = null) {
    this.warn(`Security: ${event}`, context, details);
  }

  performance(operation, duration, context = null) {
    this.debug(`Performance: ${operation} took ${duration}ms`, context);
  }
}

// Export singleton instance
const logger = new Logger();

// Export the class for testing
module.exports = { Logger, logger };
