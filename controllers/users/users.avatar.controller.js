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

const getPublicBaseUrl = (req) => {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
};

const toPublicUploadUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${getPublicBaseUrl(req)}${relativePath}`;
};

const deleteExistingAvatarFile = (storedProfilePicture) => {
  if (!storedProfilePicture) return;

  // supports both absolute URL and relative path
  const filename = path.basename(storedProfilePicture);
  const filePath = path.join(
    process.cwd(),
    "uploads",
    "profile-pictures",
    filename
  );

  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore delete failures
  }
};

// PUT /api/v1/users/me/profile (profile + avatar in multipart)
exports.updateProfileWithAvatar = asyncHandler(async (req, res) => {
  const { name, title, department, location, bio } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (title !== undefined) updateData.title = String(title).trim();
  if (department !== undefined)
    updateData.department = String(department).trim();
  if (location !== undefined) updateData.location = String(location).trim();
  if (bio !== undefined) updateData.bio = String(bio).trim();

  if (req.file) {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    deleteExistingAvatarFile(user.profilePicture);

    const relative = `/uploads/profile-pictures/${req.file.filename}`;
    updateData.profilePicture = toPublicUploadUrl(req, relative);
  }

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updated) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  logger.info(`✏️ Profile and avatar updated: ${updated.email}`);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: formatUserResponse(updated),
  });
});

// POST /api/v1/users/me/avatar
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image file",
      code: "NO_FILE_UPLOADED",
    });
  }

  const user = await User.findById(req.user.id).select(
    "-password -refreshToken"
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  deleteExistingAvatarFile(user.profilePicture);

  const relative = `/uploads/profile-pictures/${req.file.filename}`;
  user.profilePicture = toPublicUploadUrl(req, relative);
  await user.save();

  logger.info(`📸 Avatar uploaded for user ${user._id}`);

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
  const user = await User.findById(req.user.id).select(
    "-password -refreshToken"
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  deleteExistingAvatarFile(user.profilePicture);

  user.profilePicture = null;
  await user.save();

  logger.info(`🗑️ Avatar deleted for user ${user._id}`);

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
