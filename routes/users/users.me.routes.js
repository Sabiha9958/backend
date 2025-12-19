// routes/users/users.me.routes.js
const express = require("express");
const router = express.Router();

const { userController } = require("../../controllers");
const { protect } = require("../../middleware/auth/auth.middleware");
const { updateProfileValidator } = require("../../middleware");
const {
  sensitiveLimiter,
  uploadLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");
const {
  uploadAvatar,
  uploadCover,
  handleMulterError,
  cleanupUploadedFiles,
} = require("../../middleware/upload/upload.middleware");

// Get current user profile
router.get("/me", protect, userController.getCurrentUserProfile);

// Update current user profile (JSON)
router.put(
  "/me",
  protect,
  sensitiveLimiter,
  updateProfileValidator,
  userController.updateCurrentUserProfile
);

// Update profile with avatar (multipart)
router.put(
  "/me/profile",
  protect,
  uploadLimiter,
  uploadAvatar,
  handleMulterError,
  userController.updateProfileWithAvatar,
  cleanupUploadedFiles
);

// Upload/update avatar
router.post(
  "/me/avatar",
  protect,
  uploadLimiter,
  uploadAvatar,
  handleMulterError,
  userController.uploadAvatar,
  cleanupUploadedFiles
);

// Delete avatar
router.delete(
  "/me/avatar",
  protect,
  sensitiveLimiter,
  userController.deleteAvatar
);

// Upload/update cover image (if you really upload cover files)
router.post(
  "/me/cover",
  protect,
  uploadLimiter,
  uploadCover,
  handleMulterError,
  userController.uploadCoverImage,
  cleanupUploadedFiles
);

module.exports = router;
