// controllers/auth/auth.admin-users.controller.js

const User = require("../../models/user/user.model");
const logger = require("../../utils/logging/logger");
const {
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
} = require("./auth.helpers");

// List users with filters (admin)
exports.adminListUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = { isDeleted: { $ne: true } };

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -refreshToken")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  logger.info(
    `📋 Admin ${req.user.email} retrieved ${users.length} users (page ${pageNum})`
  );

  return res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: users,
  });
});

// Get single user (admin)
exports.adminGetUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  })
    .select("-password -refreshToken")
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(`👤 Admin ${req.user.email} viewed user: ${user.email}`);

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// Update user fields (admin)
exports.adminUpdateUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    title,
    department,
    location,
    bio,
    isActive,
    role,
  } = req.body;

  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const updates = {};

  // normal fields
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (phone !== undefined) updates.phone = phone?.trim();
  if (title !== undefined) updates.title = title?.trim();
  if (department !== undefined) updates.department = department?.trim();
  if (location !== undefined) updates.location = location?.trim();
  if (bio !== undefined) updates.bio = bio?.trim();
  if (isActive !== undefined) updates.isActive = isActive;

  // role change (admin only)
  if (role !== undefined) {
    if (!["user", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be user, staff, or admin",
      });
    }

    // prevent changing own role (same as your PATCH controller)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    if (user.role !== role) {
      updates.role = role;
      updates.roleChangedAt = new Date();
      updates.roleChangedBy = req.user._id;
    }
  }

  Object.assign(user, updates);
  await user.save(); // will validate enum on role [web:118]

  logger.info(
    `✏️ Admin ${req.user.email} updated user: ${user.email} (${Object.keys(
      updates
    ).join(", ")})`
  );

  await logAuditEvent({
    action: "USER_UPDATED_BY_ADMIN",
    adminId: req.user._id,
    adminEmail: req.user.email,
    targetUserId: user._id,
    targetUserEmail: user.email,
    changes: Object.keys(updates),
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: formatUserResponse(user),
  });
});

// Update user role (admin)
exports.adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "staff", "admin"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Must be user, staff, or admin",
    });
  }

  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "You cannot change your own role",
    });
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  logger.info(
    `🔐 Admin ${req.user.email} changed role of ${user.email}: ${oldRole} → ${role}`
  );

  await logAuditEvent({
    action: "USER_ROLE_CHANGED",
    adminId: req.user._id,
    adminEmail: req.user.email,
    targetUserId: user._id,
    targetUserEmail: user.email,
    oldRole,
    newRole: role,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: formatUserResponse(user),
  });
});

// Soft delete user (admin)
exports.adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;

  await user.save();

  logger.info(`🗑️ Admin ${req.user.email} deleted user: ${user.email}`);

  await logAuditEvent({
    action: "USER_DELETED",
    adminId: req.user._id,
    adminEmail: req.user.email,
    targetUserId: user._id,
    targetUserEmail: user.email,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// Bulk delete users (admin)
exports.adminBulkDeleteUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of user IDs",
    });
  }

  if (userIds.includes(req.user._id.toString())) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  const result = await User.updateMany(
    {
      _id: { $in: userIds },
      isDeleted: { $ne: true },
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    }
  );

  logger.info(
    `🗑️ Admin ${req.user.email} bulk deleted ${result.modifiedCount} users`
  );

  await logAuditEvent({
    action: "BULK_DELETE_USERS",
    adminId: req.user._id,
    adminEmail: req.user.email,
    deletedCount: result.modifiedCount,
    userIds,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: `${result.modifiedCount} user(s) deleted successfully`,
    deletedCount: result.modifiedCount,
  });
});

// Team members list (public/staff)
exports.getTeamMembers = asyncHandler(async (req, res) => {
  const team = await User.find({
    isDeleted: { $ne: true },
    isActive: true,
  })
    .select("name email profilePicture role title department")
    .sort({ name: 1 })
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    count: team.length,
    data: team,
  });
});
