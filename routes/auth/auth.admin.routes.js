const express = require("express");
const router = express.Router();

const { authController } = require("../../controllers");
const {
  protect,
  authorize,
  sensitiveLimiter,
  getUsersQueryValidator,
  updateUserValidator,
  updateUserRoleValidator,
  deleteUserValidator,
  bulkDeleteUsersValidator,
} = require("../../middleware");

// Validate :id as ObjectId
router.param("id", (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }
  next();
});

// List users
router.get(
  "/users",
  protect,
  authorize("admin", "staff"),
  getUsersQueryValidator,
  authController.adminListUsers
);

// Get user by ID
router.get(
  "/users/:id",
  protect,
  authorize("admin"),
  authController.adminGetUserById
);

// Update user
router.put(
  "/users/:id",
  protect,
  authorize("admin"),
  updateUserValidator,
  authController.adminUpdateUser
);

// Update user role
router.patch(
  "/users/:id/role",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  updateUserRoleValidator,
  authController.adminUpdateUserRole
);

// Delete user
router.delete(
  "/users/:id",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  deleteUserValidator,
  authController.adminDeleteUser
);

// Bulk delete users
router.post(
  "/users/bulk-delete",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  bulkDeleteUsersValidator,
  authController.adminBulkDeleteUsers
);

module.exports = router;
