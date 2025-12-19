// controllers/users/users.me.controller.js

const { User } = require("./users.helpers");
const {
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  logger,
} = require("./users.helpers");

// Get current user profile
exports.getCurrentUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const user = formatUserResponse(req.user);

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// Update current user profile
exports.updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const { name, title, department, location, bio, coverId } = req.body;

  const updateData = {};

  if (name !== undefined) updateData.name = name.trim();
  if (title !== undefined) updateData.title = title?.trim();
  if (department !== undefined) updateData.department = department?.trim();
  if (location !== undefined) updateData.location = location?.trim();
  if (bio !== undefined) updateData.bio = bio?.trim();
  if (coverId !== undefined) updateData.coverId = coverId;

  if (!Object.keys(updateData).length) {
    return res.status(400).json({
      success: false,
      message: "No fields to update",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(`✏️ Profile updated: ${user.email}`);

  await logAuditEvent({
    action: "PROFILE_UPDATED",
    userId: user._id,
    changes: Object.keys(updateData),
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: formatUserResponse(user),
  });
});
