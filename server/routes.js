const authRoutes = require("../routes/auth/auth.routes");
const usersRoutes = require("../routes/users/users.routes");
const complaintsRoutes = require("../routes/complaints/complaints.routes");
const reportsRoutes = require("../routes/reports/reports.routes");
const adminRoutes = require("../routes/users/users.routes");
const logger = require("../utils/logging/logger");

// Attach health, version, system and API routers
const attachRoutes = (app, CONFIG, fs, mongoose) => {
  // Root info
  app.get("/", (req, res) => {
    res.json({
      success: true,
      name: "Complaint Management System API",
      version: "2.0.0",
      status: "operational",
      environment: CONFIG.NODE_ENV,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "/api/health",
        version: "/api/version",
        auth: "/api/auth",
        users: "/api/users",
        complaints: "/api/complaints",
        reports: "/api/reports",
        admin: "/api/admin",
      },
      websocket: `ws://localhost:${CONFIG.PORT}/ws/complaints`,
    });
  });

  // Health
  app.get("/api/health", async (req, res) => {
    const startTime = Date.now();

    const healthCheck = {
      success: true,
      status: "healthy",
      environment: CONFIG.NODE_ENV,
      uptime: {
        seconds: Math.floor(process.uptime()),
      },
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
    };

    try {
      const dbState = mongoose.connection.readyState;
      healthCheck.database = {
        status: dbState === 1 ? "connected" : "disconnected",
      };
    } catch (error) {
      healthCheck.database = { status: "error", error: error.message };
      healthCheck.status = "degraded";
    }

    healthCheck.storage = {
      avatars: fs.existsSync(CONFIG.UPLOAD_DIRS.AVATARS),
      covers: fs.existsSync(CONFIG.UPLOAD_DIRS.COVERS),
      complaints: fs.existsSync(CONFIG.UPLOAD_DIRS.COMPLAINTS),
    };

    healthCheck.responseTime = `${Date.now() - startTime}ms`;

    const statusCode = healthCheck.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  });

  // Version
  app.get("/api/version", (req, res) => {
    res.json({
      success: true,
      version: "2.0.0",
      apiVersion: CONFIG.API_VERSION,
      buildDate: new Date().toISOString(),
      node: process.version,
      limits: {
        maxFileSize: CONFIG.MAX_FILE_SIZE,
        maxUploadFiles: CONFIG.MAX_UPLOAD_FILES,
        requestTimeout: `${CONFIG.REQUEST_TIMEOUT}ms`,
      },
    });
  });

  // System stats
  app.get("/api/system/stats", (req, res) => {
    res.json({
      success: true,
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        environment: CONFIG.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      database: {
        status: mongoose.connection.readyState,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // API routers
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/complaints", complaintsRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/admin", adminRoutes);

  logger.info("✅ API routes mounted");
};

module.exports = attachRoutes;
