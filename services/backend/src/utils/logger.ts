import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
});