// controllers/users/users.avatar.controller.js
const path = require("path");
const fs = require("fs/promises");
const {
  User,
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  logger,
} = require("./users.helpers");

// Prefer fixed public URL in production (recommended)
const getPublicBaseUrl = (req) => {
  const envBase = process.env.PUBLIC_BASE_URL; // e.g. https://api.example.com
  if (envBase) return envBase.replace(/\/+$/, "");

  // Dev fallback: derive from request
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http")
    .split(",")[0]
    .trim();
  return `${proto}://${req.get("host")}`;
};

const toPublicUploadUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${getPublicBaseUrl(req)}${relativePath}`;
};

const getAvatarDiskPathFromStoredValue = (storedProfilePicture) => {
  if (!storedProfilePicture) return null;
  const filename = path.basename(storedProfilePicture); // works for URL or /uploads/...
  return path.join(process.cwd(), "uploads", "profile-pictures", filename);
};

const safeDeleteFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore (file missing, permission, etc.)
  }
};

const normalizeOptionalString = (v) => {
  if (v === undefined) return undefined; // not provided
  const trimmed = String(v).trim();
  return trimmed.length ? trimmed : null; // provided but empty => null
};

const applyAvatarFromUpload = async (req, userDoc) => {
  if (!req.file) return { changed: false };

  // delete old avatar file (if any)
  const oldPath = getAvatarDiskPathFromStoredValue(userDoc.profilePicture);
  await safeDeleteFile(oldPath);

  // save new URL
  const relative = `/uploads/profile-pictures/${req.file.filename}`;
  userDoc.profilePicture = toPublicUploadUrl(req, relative);

  return { changed: true };
};

// PUT /api/v1/users/me/profile (profile + avatar in multipart)
exports.updateProfileWithAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -refreshToken");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // update text fields (if present)
  const name = normalizeOptionalString(req.body.name);
  const title = normalizeOptionalString(req.body.title);
  const department = normalizeOptionalString(req.body.department);
  const location = normalizeOptionalString(req.body.location);
  const bio = normalizeOptionalString(req.body.bio);

  if (name !== undefined) user.name = name; // name should stay required; validator handles it
  if (title !== undefined) user.title = title;
  if (department !== undefined) user.department = department;
  if (location !== undefined) user.location = location;
  if (bio !== undefined) user.bio = bio;

  // apply avatar if uploaded
  await applyAvatarFromUpload(req, user);

  await user.save();

  logger.info(`✏️ Profile (and maybe avatar) updated: ${user.email}`);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: formatUserResponse(user),
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

  const user = await User.findById(req.user.id).select("-password -refreshToken");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  await applyAvatarFromUpload(req, user);
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
  const user = await User.findById(req.user.id).select("-password -refreshToken");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  const oldPath = getAvatarDiskPathFromStoredValue(user.profilePicture);
  await safeDeleteFile(oldPath);

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
