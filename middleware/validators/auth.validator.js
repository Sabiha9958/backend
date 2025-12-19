// auth

const { body } = require("express-validator");

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").optional().trim(),
];

const validateLogin = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").trim().notEmpty().withMessage("Password is required"),
];

const validateChangePassword = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .trim()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

const validateForgotPassword = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
];

const validateResetPassword = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
};
