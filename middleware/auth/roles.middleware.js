// roles

const logger = require("../../utils/logging/logger");

// roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn("Authorization failed - user not authenticated");
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required.",
        code: "NOT_AUTHENTICATED",
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized access by ${req.user.email} (role: ${
          req.user.role
        }) required: ${allowedRoles.join(", ")}`
      );

      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Access denied. Required role: ${allowedRoles.join(", ")}.`,
        code: "INSUFFICIENT_PERMISSIONS",
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug?.(
      `User authorized: ${req.user.email} with role ${req.user.role}`
    );
    next();
  };
};

// roles
const adminOnly = authorize("admin");

module.exports = {
  authorize,
  adminOnly,
};
