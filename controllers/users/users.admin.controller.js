// controllers/users/users.admin.controller.js

const {
  User,
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  logger,
} = require("./users.helpers");

// GET /api/v1/users
exports.adminGetUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const filter = { isDeleted: { $ne: true } };

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  if (req.query.role && ["user", "staff", "admin"].includes(req.query.role)) {
    filter.role = req.query.role;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const sortField = req.query.sort || "createdAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean(),
    User.countDocuments(filter),
  ]);

  logger.info(
    `📋 User list retrieved: ${users.length} users (Page ${page}) by ${req.user.email}`
  );

  return res.status(200).json({
    success: true,
    count: users.length,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// GET /api/v1/users/:id
exports.adminGetUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -refreshToken"
  );

  if (!user || user.isDeleted) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: formatUserResponse(user),
  });
});

// PUT /api/v1/users/:id
exports.adminUpdateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, isActive, coverId, title, department } =
    req.body;

  const updateData = {};

  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (coverId !== undefined) updateData.coverId = coverId;
  if (title !== undefined) updateData.title = title?.trim();
  if (department !== undefined) updateData.department = department?.trim();

  updateData.updatedAt = Date.now();

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(
    `✏️ User updated: ${user.email} by ${req.user.email} (Admin ID: ${req.user._id})`
  );

  await logAuditEvent({
    action: "USER_UPDATED",
    performedBy: req.user._id,
    targetUser: user._id,
    changes: updateData,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: formatUserResponse(user),
  });
});

// PATCH /api/v1/users/:id/role  (admin only)
exports.adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "staff", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  // prevent changing own role
  if (req.user.id === req.params.id) {
    return res
      .status(400)
      .json({ success: false, message: "You cannot change your own role" });
  }

  const user = await User.findById(req.params.id).select(
    "-password -refreshToken"
  );
  if (!user || user.isDeleted) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const oldRole = user.role;
  user.role = role;
  user.roleChangedAt = new Date();
  user.roleChangedBy = req.user._id;

  await user.save();

  logger.info(
    `🔐 Role changed: ${user.email} ${oldRole} -> ${role} by ${req.user.email}`
  );

  await logAuditEvent({
    action: "USER_ROLE_CHANGED",
    performedBy: req.user._id,
    targetUser: user._id,
    oldRole,
    newRole: role,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: formatUserResponse(user),
  });
});

// DELETE /api/v1/users/:id
exports.adminSoftDeleteUser = asyncHandler(async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({
      success: false,
      message: "Cannot delete your own account",
    });
  }

  const user = await User.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: Date.now(),
    deletedBy: req.user.id,
    isActive: false,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(`🗑️ User soft deleted: ${user.email} by ${req.user.email}`);

  await logAuditEvent({
    action: "USER_DELETED",
    performedBy: req.user._id,
    targetUser: req.params.id,
    targetEmail: user.email,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// GET /api/v1/users/stats
exports.adminGetUserStats = asyncHandler(async (req, res) => {
  const [total, active, inactive, byRole] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ isDeleted: { $ne: true }, isActive: true }),
    User.countDocuments({ isDeleted: { $ne: true }, isActive: false }),
    User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
  ]);

  const roleStats = {
    admin: 0,
    staff: 0,
    user: 0,
  };

  byRole.forEach(({ _id, count }) => {
    roleStats[_id] = count;
  });

  return res.json({
    success: true,
    data: {
      total,
      active,
      inactive,
      byRole: roleStats,
    },
  });
});
