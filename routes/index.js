// routes/index.js

const express = require("express");
const router = express.Router();

// Feature routers
const authRoutes = require("./auth/auth.routes");
const usersRoutes = require("./users/users.routes");
const complaintsRoutes = require("./complaints/complaints.routes");
const reportsRoutes = require("./reports/reports.routes");

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

// API overview
router.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Complaint Management System API v1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: { base: "/api/v1/auth" },
      users: { base: "/api/v1/users" },
      complaints: { base: "/api/v1/complaints" },
      reports: { base: "/api/v1/reports" },
    },
  });
});

// Mount versioned routers
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/users", usersRoutes);
router.use("/api/v1/complaints", complaintsRoutes);
router.use("/api/v1/reports", reportsRoutes);

// Global 404
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

module.exports = router;
