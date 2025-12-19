// controllers/auth/auth.google.controller.js

const crypto = require("crypto");
const User = require("../../models/user/user.model");
const logger = require("../../utils/logging/logger");
const {
  asyncHandler,
  logAuditEvent,
  sendAuthResponse,
} = require("./auth.helpers");

exports.handleGoogleAuth = asyncHandler(async (req, res) => {
  const { email, name, picture, googleId } = req.body;

  if (!email || !name || !googleId) {
    logger.warn("⚠️ Google auth missing required data");
    return res.status(400).json({
      success: false,
      message: "Missing required Google authentication info",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  let isNewUser = false;

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.profilePicture = picture || user.profilePicture;
      user.isEmailVerified = true;

      await user.save({ validateBeforeSave: false });
      logger.info(`🔗 Linked Google account to existing user: ${user.email}`);
    } else {
      logger.info(`✅ Existing Google user logged in: ${user.email}`);
    }
  } else {
    isNewUser = true;

    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      googleId,
      profilePicture: picture,
      role: "user",
      isEmailVerified: true,
      password: crypto.randomBytes(32).toString("hex"),
    });

    logger.info(
      `✅ New user registered via Google: ${user.email} (ID: ${user._id})`
    );
  }

  await logAuditEvent({
    action: "GOOGLE_AUTH",
    userId: user._id,
    email: user.email,
    method: isNewUser ? "REGISTER" : "LOGIN",
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendAuthResponse(
    user,
    200,
    res,
    isNewUser
      ? "Account created successfully with Google"
      : "Google authentication successful"
  );
});
