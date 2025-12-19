// src/utils/logging/logger.js
const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Main log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) =>
    stack
      ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
      : `[${timestamp}] ${level.toUpperCase()}: ${message}`
  )
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(
          ({ timestamp, level, message }) =>
            `[${timestamp}] ${level}: ${message}`
        )
      ),
    }),
    new transports.DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new transports.DailyRotateFile({
      filename: path.join(logDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

// Stream for HTTP logger
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
