// controllers/users/users.cover.controller.js

const path = require("path");
const fs = require("fs");
const {
  User,
  asyncHandler,
  formatUserResponse,
  logAuditEvent,
  logger,
} = require("./users.helpers");

// POST /api/v1/users/me/cover
exports.uploadCoverImage = asyncHandler(async (req, res) => {
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

  if (user.coverImage) {
    const oldPath = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "cover-images",
      path.basename(user.coverImage)
    );
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  user.coverImage = `/uploads/cover-images/${req.file.filename}`;
  await user.save();

  logger.info(`🖼️ Cover image uploaded for user ${userId}`);

  await logAuditEvent({
    action: "COVER_IMAGE_UPLOADED",
    userId: user._id,
    timestamp: new Date(),
  });

  return res.json({
    success: true,
    message: "Cover image uploaded successfully",
    data: formatUserResponse(user),
  });
});

// DELETE /api/v1/users/me/cover - ADD THIS FUNCTION
exports.deleteCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (!user.coverImage) {
    return res.status(400).json({
      success: false,
      message: "No cover image to delete",
    });
  }

  // Delete physical file
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "cover-images",
    path.basename(user.coverImage)
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  user.coverImage = null;
  await user.save();

  logger.info(`🗑️ Cover image deleted for user ${userId}`);

  await logAuditEvent({
    action: "COVER_IMAGE_DELETED",
    userId: user._id,
    timestamp: new Date(),
  });

  return res.json({
    success: true,
    message: "Cover image deleted successfully",
    data: formatUserResponse(user),
  });
});
