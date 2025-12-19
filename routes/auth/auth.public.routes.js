const express = require("express");
const router = express.Router();

const { authController } = require("../../controllers");
const {
  authLimiter,
  registerValidator,
  loginValidator,
} = require("../../middleware");

// Public auth routes
router.post(
  "/register",
  authLimiter,
  registerValidator,
  authController.registerUser
);

router.post("/login", authLimiter, loginValidator, authController.loginUser);

router.post("/google", authLimiter, authController.handleGoogleAuth);

router.post("/refresh", authLimiter, authController.refreshAuthToken);

router.post("/logout", authController.logoutUser);

module.exports = router;
