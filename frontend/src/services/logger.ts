// HOA Nexus Frontend Logging Service
import config from '../config';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private isDevelopment = config.app.environment === 'development';
  private isDebug = config.app.debug;

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const level = entry.level.toUpperCase();
    const context = entry.context ? `[${entry.context}]` : '';
    const message = entry.message;
    
    return `${timestamp} ${level} ${context} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (this.isDebug) return true;
    
    // In production, only log errors and warnings
    return level === LogLevel.ERROR || level === LogLevel.WARN;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
      error,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '', error || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '');
        break;
    }

    // In development, also log to console for debugging
    if (this.isDevelopment && data) {
      console.group(`📝 ${context || 'Application'}`);
      console.log('Data:', data);
      if (error) {
        console.error('Error:', error);
        console.trace('Stack trace:');
      }
      console.groupEnd();
    }
  }

  error(message: string, context?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  // Convenience methods for common logging patterns
  apiError(endpoint: string, error: Error, context?: string): void {
    this.error(`API request failed for ${endpoint}`, context, { endpoint }, error);
  }

  dataFetchError(entity: string, error: Error, context?: string): void {
    this.error(`Failed to fetch ${entity}`, context, { entity }, error);
  }

  userAction(action: string, details?: unknown, context?: string): void {
    this.info(`User action: ${action}`, context, details);
  }

  performance(operation: string, duration: number, context?: string): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, context, { operation, duration });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export the class for testing
export { Logger };

export default logger;
