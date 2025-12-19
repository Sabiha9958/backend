// routes/users/users.routes.js

const express = require("express");
const router = express.Router();

const meRoutes = require("./users.me.routes");
const adminRoutes = require("./users.admin.routes");

// Current user routes
router.use(meRoutes);

// Admin/staff routes
router.use(adminRoutes);

// Users 404
router.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
});

module.exports = router;
