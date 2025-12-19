const express = require("express");
const router = express.Router();

const publicRoutes = require("./auth.public.routes");
const passwordRoutes = require("./auth.password.routes");
const meRoutes = require("./auth.me.routes");
const adminRoutes = require("./auth.admin.routes");

// Mount segments
router.use(publicRoutes);
router.use(passwordRoutes);
router.use(meRoutes);
router.use(adminRoutes);

// Auth 404
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Authentication endpoint not found",
    path: req.originalUrl,
  });
});

module.exports = router;
