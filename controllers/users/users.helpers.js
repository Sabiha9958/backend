// controllers/users/users.helpers.js

const User = require("../../models/user/user.model");
const logger = require("../../utils/logging/logger");

// Wrap async route handlers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Remove sensitive fields
const formatUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  const sensitiveFields = [
    "password",
    "refreshToken",
    "__v",
    "loginAttempts",
    "lockUntil",
    "resetPasswordToken",
    "resetPasswordExpire",
    "emailVerificationToken",
    "emailVerificationExpire",
    "googleId",
  ];
  sensitiveFields.forEach((field) => delete obj[field]);
  return obj;
};

// Log audit events
const logAuditEvent = async (eventData) => {
  try {
    logger.info(`🔐 AUDIT: ${JSON.stringify(eventData)}`);
  } catch (error) {
    logger.error(`❌ Audit log error: ${error.message}`);
  }
};
module.exports = {
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  User,
  logger,
};
