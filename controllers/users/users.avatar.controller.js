// controllers/users/users.avatar.controller.js

const path = require("path");
const fs = require("fs");
const {
  User,
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  logger,
} = require("./users.helpers");

// PUT /api/v1/users/me/profile (profile + avatar in multipart)
exports.updateProfileWithAvatar = asyncHandler(async (req, res) => {
  const { name, title, department, location, bio } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name.trim();
  if (title !== undefined) updateData.title = title?.trim();
  if (department !== undefined) updateData.department = department?.trim();
  if (location !== undefined) updateData.location = location?.trim();
  if (bio !== undefined) updateData.bio = bio?.trim();

  if (req.file) {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.profilePicture) {
      const oldPath = path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        "profile-pictures",
        path.basename(user.profilePicture)
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    updateData.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
  }

  updateData.updatedAt = Date.now();

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(`✏️ Profile and avatar updated: ${user.email}`);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: formatUserResponse(user),
  });
});

// POST /api/v1/users/me/avatar
exports.uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image file",
      code: "NO_FILE_UPLOADED",
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (user.profilePicture) {
    const oldPath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "profile-pictures",
      path.basename(user.profilePicture)
    );
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
  await user.save();

  logger.info(`📸 Avatar uploaded for user ${userId}`);

  await logAuditEvent({
    action: "AVATAR_UPLOADED",
    userId: user._id,
    timestamp: new Date(),
  });

  return res.json({
    success: true,
    message: "Avatar uploaded successfully",
    data: formatUserResponse(user),
  });
});

// DELETE /api/v1/users/me/avatar
exports.deleteAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (user.profilePicture) {
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "profile-pictures",
      path.basename(user.profilePicture)
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  user.profilePicture = null;
  await user.save();

  logger.info(`🗑️ Avatar deleted for user ${userId}`);

  await logAuditEvent({
    action: "AVATAR_DELETED",
    userId: user._id,
    timestamp: new Date(),
  });

  return res.json({
    success: true,
    message: "Avatar deleted successfully",
    data: formatUserResponse(user),
  });
});
