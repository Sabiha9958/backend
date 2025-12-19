// controllers/auth/auth.login.controller.js

const User = require("../../models/user/user.model");
const logger = require("../../utils/logging/logger");
const {
  asyncHandler,
  logAuditEvent,
  sendAuthResponse,
} = require("./auth.helpers");

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  }).select("+password +loginAttempts +lockUntil");

  if (!user) {
    logger.warn(`⚠️ Login attempt with non-existent email: ${normalizedEmail}`);
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    logger.warn(`🔒 Login attempt on locked account: ${user.email}`);
    return res.status(423).json({
      success: false,
      message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      lockedUntil: user.lockUntil,
    });
  }

  if (!user.isActive) {
    logger.warn(`⚠️ Login attempt on deactivated account: ${user.email}`);
    return res.status(403).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
    });
  }

  const isPasswordCorrect = await user.comparePassword(password.trim());

  if (!isPasswordCorrect) {
    await user.incrementLoginAttempts();
    logger.warn(`❌ Failed login attempt for user: ${user.email}`);
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  logger.info(`✅ Successful login: ${user.email} (ID: ${user._id})`);

  await logAuditEvent({
    action: "USER_LOGIN",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendAuthResponse(user, 200, res, "Login successful");
});
