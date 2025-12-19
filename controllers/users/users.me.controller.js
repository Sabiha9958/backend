// controllers/users/users.me.controller.js
const { User } = require("./users.helpers");
const {
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  logger,
} = require("./users.helpers");

const normalizeString = (v) => {
  if (v === undefined) return undefined;
  if (v === null) return "";
  return String(v).trim();
};

const normalizeCoverId = (v) => {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  // match your preset COVER_IMAGES range
  if (n < 1) return 1;
  if (n > 50) return 50;
  return Math.floor(n);
};

// Get current user profile (always from DB)
exports.getCurrentUserProfile = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  const freshUser = await User.findById(req.user.id).select(
    "-password -refreshToken"
  );
  if (!freshUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({
    success: true,
    data: formatUserResponse(freshUser),
  });
});

// Update current user profile
exports.updateCurrentUserProfile = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  const updateData = {};

  // Strings
  const name = normalizeString(req.body.name);
  const title = normalizeString(req.body.title);
  const department = normalizeString(req.body.department);
  const location = normalizeString(req.body.location);
  const bio = normalizeString(req.body.bio);

  // Only set if provided (undefined means not in request)
  if (req.body.name !== undefined) updateData.name = name;
  if (req.body.title !== undefined) updateData.title = title || null;
  if (req.body.department !== undefined)
    updateData.department = department || null;
  if (req.body.location !== undefined) updateData.location = location || null;
  if (req.body.bio !== undefined) updateData.bio = bio || null;

  // ✅ Preset coverId (important)
  if (req.body.coverId !== undefined) {
    updateData.coverId = normalizeCoverId(req.body.coverId);
  }

  if (!Object.keys(updateData).length) {
    return res
      .status(400)
      .json({ success: false, message: "No fields to update" });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken"); // keep response consistent

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
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
