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

// Update current user profile
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
  cleanupUploadedFiles,
  uploadAvatar,
  handleMulterError,
  userController.updateProfileWithAvatar
);

// Upload/update avatar
router.post(
  "/me/avatar",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadAvatar,
  handleMulterError,
  userController.uploadAvatar
);

// Delete avatar
router.delete(
  "/me/avatar",
  protect,
  sensitiveLimiter,
  userController.deleteAvatar
);

// Upload/update cover image
router.post(
  "/me/cover",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadCover,
  handleMulterError,
  userController.uploadCoverImage
);

module.exports = router;
