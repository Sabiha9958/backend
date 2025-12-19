const express = require("express");
const router = express.Router();

const { userController } = require("../../controllers");
const {
  protect,
  authorize,
  getUsersQueryValidator,
  updateUserValidator,
  updateUserRoleValidator,
  deleteUserValidator,
  bulkDeleteUsersValidator,
} = require("../../middleware");

const {
  sensitiveLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");

// User statistics
router.get(
  "/stats",
  protect,
  authorize("admin", "staff"),
  userController.adminGetUserStats
);

// Bulk actions (delete/activate/deactivate)
router.post(
  "/bulk",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  bulkDeleteUsersValidator,
  userController.adminBulkUserAction
);

// List users
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  getUsersQueryValidator,
  userController.adminGetUsers
);

// Get user by ID
router.get(
  "/:id",
  protect,
  authorize("admin", "staff"),
  deleteUserValidator,
  userController.adminGetUserById
);

// Update user (normal fields)
router.put(
  "/:id",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  updateUserValidator,
  userController.adminUpdateUser
);

// ✅ Update user role (admin only)
router.patch(
  "/:id/role",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  updateUserRoleValidator,
  userController.adminUpdateUserRole
);

// Delete user (admin only)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  deleteUserValidator,
  userController.adminSoftDeleteUser
);

module.exports = router;
