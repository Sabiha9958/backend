const express = require("express");
const router = express.Router();

const { authController } = require("../../controllers");
const {
  sensitiveLimiter,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../../middleware");

// Password recovery
router.post(
  "/forgot-password",
  sensitiveLimiter,
  forgotPasswordValidator,
  authController.requestPasswordReset
);

router.post(
  "/reset-password",
  sensitiveLimiter,
  resetPasswordValidator,
  authController.resetPassword
);

module.exports = router;
