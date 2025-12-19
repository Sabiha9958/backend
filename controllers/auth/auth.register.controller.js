// controllers/auth/auth.register.controller.js

const User = require("../../models/user/user.model");
const logger = require("../../utils/logging/logger");
const {
  asyncHandler,
  logAuditEvent,
  sendAuthResponse,
} = require("./auth.helpers");

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: password.trim(),
    phone: phone?.trim(),
    role: "user",
  });

  logger.info(`✅ New user registered: ${user.email} (ID: ${user._id})`);

  await logAuditEvent({
    action: "USER_REGISTERED",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendAuthResponse(user, 201, res, "Registration successful");
});
