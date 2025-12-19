// controllers/auth/auth.session.controller.js

const { clearAuthCookies } = require("../../utils/auth/jwtUtils");
const logger = require("../../utils/logging/logger");
const { asyncHandler, logAuditEvent } = require("./auth.helpers");

exports.logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    logger.info(`👋 User logged out: ${req.user.email} (ID: ${req.user._id})`);

    await logAuditEvent({
      action: "USER_LOGOUT",
      userId: req.user._id,
      email: req.user.email,
      timestamp: new Date(),
    });
  }

  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
