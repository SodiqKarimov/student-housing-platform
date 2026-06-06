const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');

const auditTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: `${process.env.AUDIT_LOG_RETENTION_DAYS || 365}d`,
  level: 'info',
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '90d',
  level: 'error',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    auditTransport,
    errorTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
  ],
});

module.exports = logger;
