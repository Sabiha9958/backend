// routes/auth/auth.me.routes.js

const express = require("express");
const router = express.Router();
const { authController, userController } = require("../../controllers");
const {
  protect,
  sensitiveLimiter,
  updateProfileValidator,
  changePasswordValidator,
  upload,
} = require("../../middleware");

// Profile routes
router.get("/me", protect, userController.getCurrentUserProfile);
router.put(
  "/me",
  protect,
  updateProfileValidator,
  userController.updateCurrentUserProfile
);

// Security routes
router.put(
  "/change-password",
  protect,
  sensitiveLimiter,
  changePasswordValidator,
  authController.changePassword
);

// Profile media routes
router.put(
  "/me/profile-picture",
  protect,
  upload.single("profilePicture"),
  userController.uploadAvatar
);
router.delete("/me/profile-picture", protect, userController.deleteAvatar);
router.put(
  "/me/cover-image",
  protect,
  upload.single("coverImage"),
  userController.uploadCoverImage
);
router.delete("/me/cover-image", protect, userController.deleteCoverImage);

// Team routes
router.get("/team", protect, authController.getTeamMembers);

module.exports = router;
