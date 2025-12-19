// controllers/auth/auth.tokens.controller.js

const crypto = require("crypto");
const User = require("../../models/user/user.model");
const {
  generateTokenPair,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  extractToken,
} = require("../../utils/auth/jwtUtils");
const logger = require("../../utils/logging/logger");
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../../utils/email/emailService");
const {
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
} = require("./auth.helpers");

// Refresh access token using refresh token
exports.refreshAuthToken = asyncHandler(async (req, res) => {
  const refreshToken = extractToken(req, true);

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
      code: "REFRESH_TOKEN_MISSING",
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: { $ne: true },
      isActive: true,
    });

    if (!user) {
      logger.warn(
        `⚠️ Refresh token used for deleted/inactive user: ${decoded.id}`
      );
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
        code: "USER_NOT_FOUND",
      });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokenPair(user);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, newRefresh);

    logger.info(`🔄 Token refreshed for user: ${user.email}`);

    await logAuditEvent({
      action: "TOKEN_REFRESHED",
      userId: user._id,
      email: user.email,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefresh,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`❌ Token refresh error: ${error.message}`);
    clearAuthCookies(res);

    return res.status(error.status || 401).json({
      success: false,
      message: error.message || "Invalid or expired refresh token",
      code: error.code || "REFRESH_TOKEN_INVALID",
    });
  }
});

// Change password for logged-in user
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isCurrentCorrect = await user.comparePassword(currentPassword.trim());

  if (!isCurrentCorrect) {
    logger.warn(`⚠️ Failed password change attempt: ${user.email}`);
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  user.password = newPassword.trim();
  await user.save();

  logger.info(`🔐 Password changed: ${user.email} (ID: ${user._id})`);

  await logAuditEvent({
    action: "PASSWORD_CHANGED",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
  });

  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Password changed successfully. Please log in again.",
  });
});

// Start password reset flow
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email address",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  if (!user) {
    logger.warn(
      `⚠️ Password reset requested for non-existent email: ${normalizedEmail}`
    );
    // Do not leak that user does not exist
    return res.status(200).json({
      success: true,
      message: "If an account exists, a password reset email has been sent",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);

    logger.info(`📧 Password reset email sent to: ${user.email}`);

    await logAuditEvent({
      action: "FORGOT_PASSWORD_REQUEST",
      userId: user._id,
      email: user.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`❌ Forgot password email error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to send reset email. Please try again later.",
    });
  }
});

// Complete password reset using token
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are required",
    });
  }

  if (password.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
    isDeleted: { $ne: true },
  }).select("+password");

  if (!user) {
    logger.warn("⚠️ Invalid or expired reset token used");
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  user.password = password.trim();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  try {
    await sendPasswordResetConfirmation(user);
  } catch (error) {
    logger.error(
      `❌ Password reset confirmation email error: ${error.message}`
    );
  }

  logger.info(`✅ Password reset successful for: ${user.email}`);

  await logAuditEvent({
    action: "PASSWORD_RESET",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: "Password has been reset successfully. You can now log in.",
  });
});
