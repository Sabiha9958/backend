// backend/server/config.js
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const logger = require("../utils/logging/logger");

const CONFIG = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  API_VERSION: process.env.API_VERSION || "v1",

  UPLOAD_DIRS: {
    BASE: path.join(__dirname, "../uploads"),
    AVATARS: path.join(__dirname, "../uploads/profile-pictures"),
    COVERS: path.join(__dirname, "../uploads/covers"),
    COMPLAINTS: path.join(__dirname, "../uploads/complaints"),
  },

  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "50mb",
  MAX_UPLOAD_FILES: parseInt(process.env.MAX_UPLOAD_FILES || "5", 10),
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10),
  SHUTDOWN_TIMEOUT: parseInt(process.env.SHUTDOWN_TIMEOUT || "10000", 10),
  COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL || "6", 10),
  CACHE_MAX_AGE: process.env.CACHE_MAX_AGE || "7d",
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
};

// Validate required environment variables
const validateEnvironment = () => {
  const requiredEnvVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRE",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRE",
  ];

  const missing = requiredEnvVars.filter((name) => !process.env[name]);

  if (missing.length) {
    logger.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  logger.info("✅ Environment variables validated successfully");
};

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  Object.entries(CONFIG.UPLOAD_DIRS).forEach(([key, dir]) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`📁 Created upload directory: ${key} -> ${dir}`);
    }
  });
};

// Verify database connection status
const verifyDatabaseConnection = () => {
  const dbState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];

  if (dbState !== 1) {
    logger.error(
      `❌ Database not properly connected. State: ${states[dbState]}`
    );
    throw new Error("Database connection failed");
  }

  logger.info(
    `✅ Database connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`
  );
};

module.exports = {
  CONFIG,
  validateEnvironment,
  createUploadDirectories,
  verifyDatabaseConnection,
};
