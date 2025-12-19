// users

const { body, param, query } = require("express-validator");

const validateUpdateProfile = [
  body("name").optional().trim(),
  body("title").optional().trim(),
  body("department").optional().trim(),
  body("location").optional().trim(),
  body("bio").optional().trim(),
  body("coverId").optional().trim(),
];

const validateGetUsersQuery = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().trim(),
  query("role")
    .optional()
    .isIn(["user", "staff", "admin"])
    .withMessage("Invalid role"),
  query("isActive").optional().isBoolean().toBoolean(),
];

const validateUpdateUser = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("name").optional().trim(),
  body("email").optional().trim().isEmail().withMessage("Invalid email"),
  body("phone").optional().trim(),
  body("role")
    .optional()
    .isIn(["user", "staff", "admin"])
    .withMessage("Invalid role"),
  body("isActive").optional().isBoolean().withMessage("Invalid isActive"),
  body("coverId").optional().trim(),
];

const validateUpdateUserRole = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("role")
    .trim()
    .isIn(["user", "staff", "admin"])
    .withMessage("Invalid role"),
  body("reason").optional().trim(),
];

const validateDeleteUser = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

const validateBulkDeleteUsers = [
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("userIds must be a non-empty array"),
  body("userIds.*").isMongoId().withMessage("Each userId must be a valid ID"),
];

module.exports = {
  validateUpdateProfile,
  validateGetUsersQuery,
  validateUpdateUser,
  validateUpdateUserRole,
  validateDeleteUser,
  validateBulkDeleteUsers,
};
