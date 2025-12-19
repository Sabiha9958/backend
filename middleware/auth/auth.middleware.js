// auth

const User = require("../../models/user/user.model");
const {
  verifyAccessToken,
  extractToken,
} = require("../../utils/auth/jwtUtils");
const logger = require("../../utils/logging/logger");

// auth
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req, false);

    if (!token) {
      logger.warn(`No token from ${req.ip}`);
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required.",
        code: "TOKEN_MISSING",
        timestamp: new Date().toISOString(),
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
      logger.debug?.(`Token verified for user ID: ${decoded.id}`);
    } catch (error) {
      logger.warn(`Token verification failed: ${error.message}`);

      const errorResponses = {
        TokenExpiredError: {
          message: "Token has expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        },
        JsonWebTokenError: {
          message: "Invalid token. Authorization denied.",
          code: "TOKEN_INVALID",
        },
        NotBeforeError: {
          message: "Token not yet valid.",
          code: "TOKEN_NOT_ACTIVE",
        },
      };

      const errorResponse = errorResponses[error.name] || {
        message: "Token verification failed.",
        code: "TOKEN_VERIFICATION_FAILED",
      };

      return res.status(401).json({
        success: false,
        statusCode: 401,
        ...errorResponse,
        timestamp: new Date().toISOString(),
      });
    }

    const currentUser = await User.findById(decoded.id).select(
      "-password -refreshToken -__v -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire"
    );

    if (!currentUser) {
      logger.warn(`Token valid but user not found: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "User associated with this token no longer exists.",
        code: "USER_NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
    }

    if (currentUser.isDeleted) {
      logger.warn(`Deleted user attempted access: ${currentUser.email}`);
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message:
          "This account has been permanently deleted. Please contact support.",
        code: "ACCOUNT_DELETED",
        timestamp: new Date().toISOString(),
      });
    }

    if (!currentUser.isActive) {
      logger.warn(`Inactive user attempted access: ${currentUser.email}`);
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message:
          "Your account is currently deactivated. Please contact support.",
        code: "ACCOUNT_INACTIVE",
        timestamp: new Date().toISOString(),
      });
    }

    if (
      typeof currentUser.changedPasswordAfter === "function" &&
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      logger.warn(`Token issued before password change: ${currentUser.email}`);
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message:
          "Password was recently changed. Please log in again with your new password.",
        code: "PASSWORD_CHANGED",
        timestamp: new Date().toISOString(),
      });
    }

    req.user = currentUser;
    logger.debug?.(
      `User authenticated: ${currentUser.email} (${currentUser.role})`
    );

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`, {
      stack: error.stack,
      ip: req.ip,
    });

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "An authentication error occurred. Please try again.",
      code: "AUTH_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

// auth
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req, false);

    if (!token) {
      logger.debug?.("Optional auth: no token, anonymous");
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);

      const currentUser = await User.findById(decoded.id).select(
        "-password -refreshToken -__v"
      );

      if (
        currentUser &&
        !currentUser.isDeleted &&
        currentUser.isActive &&
        (!currentUser.changedPasswordAfter ||
          !currentUser.changedPasswordAfter(decoded.iat))
      ) {
        req.user = currentUser;
        logger.debug?.(
          `Optional auth: user authenticated - ${currentUser.email}`
        );
      } else {
        logger.debug?.("Optional auth: user not valid, anonymous");
      }
    } catch (error) {
      logger.debug?.(
        `Optional auth: token invalid - ${error.message}, anonymous`
      );
    }

    next();
  } catch (error) {
    logger.error(`Optional auth error: ${error.message}`);
    next();
  }
};

module.exports = {
  protect,
  optionalAuth,
};
