// controllers/auth/auth.helpers.js

const logger = require("../../utils/logging/logger");
const {
  generateTokenPair,
  setAuthCookies,
} = require("../../utils/auth/jwtUtils");

// Wrap async route handlers and forward errors to Express
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Remove sensitive fields from a user object
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

// Log security / audit events
const logAuditEvent = async (eventData) => {
  try {
    logger.info(`🔐 AUDIT: ${JSON.stringify(eventData)}`);
  } catch (error) {
    logger.error(`❌ Audit log error: ${error.message}`);
  }
};

// Generate tokens, set cookies and send auth response
const sendAuthResponse = async (user, statusCode, res, message) => {
  try {
    const { accessToken, refreshToken } = generateTokenPair(user);

    if (typeof user.resetLoginAttempts === "function") {
      await user.resetLoginAttempts();
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(statusCode).json({
      success: true,
      message,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture || user.avatarUrl || user.image,
        coverImage: user.coverImage?.url || user.coverImage || null,
        coverId: user.coverId || null,
        title: user.title,
        department: user.department,
        location: user.location,
        bio: user.bio,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`❌ Auth response error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  sendAuthResponse,
};
