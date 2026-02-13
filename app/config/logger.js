/**
 * Logging Configuration
 * Uses Winston for structured logging with file and console transports
 */

import winston from 'winston';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || './logs';

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message}${metaStr ? '\n' + metaStr : ''}`;
  })
);

/**
 * Custom format for file output (JSON)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { service: 'photo-gallery' },
  transports: [
    // Console transport - colorized for development
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // File transport - all logs
    new winston.transports.File({
      filename: join(LOG_DIR, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat
    }),
    
    // File transport - errors only
    new winston.transports.File({
      filename: join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: join(LOG_DIR, 'exceptions.log'),
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: join(LOG_DIR, 'rejections.log'),
      format: fileFormat
    })
  ]
});

/**
 * Helper function to log API requests
 */
logger.logRequest = (method, path, statusCode, duration) => {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`
  });
};

/**
 * Helper function to log cache operations
 */
logger.logCache = (operation, details) => {
  logger.debug('Cache Operation', {
    operation,
    ...details
  });
};

/**
 * Helper function to log database operations
 */
logger.logDatabase = (operation, query, duration) => {
  logger.debug('Database Operation', {
    operation,
    query: query.substring(0, 100), // Truncate long queries
    duration: `${duration}ms`
  });
};

export default logger;
