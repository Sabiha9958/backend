// backend/server/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");

const { CONFIG } = require("./config");
const attachRoutes = require("./routes");

const { apiLimiter } = require("../middleware/rate/rateLimiter.middleware");
const { errorHandler, notFound } = require("../middleware");
const logger = require("../utils/logging/logger");

const { UPLOAD_BASE } = require("../middleware/upload/upload.config");

const roleRoutes = require("../routes/role/roleRoutes");
const permissionRoutes = require("../routes/role/permissionRoutes");

// ============================================================================
// CORS Configuration
// ============================================================================
const DEFAULT_ALLOWED_ORIGINS = [
  "https://frontend-8if6.onrender.com",
  "http://127.0.0.1:5173",
];

function buildAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return DEFAULT_ALLOWED_ORIGINS;

  // split, trim, remove empties, dedupe
  return [...new Set(raw.split(",").map(s => s.trim()).filter(Boolean))];
}

function corsOptions() {
  const allowedOrigins = buildAllowedOrigins();
  const allowCredentials = true;

  // If credentials are enabled, wildcard origin must NOT be used
  if (allowCredentials && allowedOrigins.includes("*")) {
    throw new Error(
      "Invalid CORS config: ALLOWED_ORIGINS cannot contain '*' when credentials=true"
    );
  }

  return {
    origin: (origin, cb) => {
      // Allow server-to-server / Postman / curl
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      logger.warn(`🚫 CORS blocked: ${origin}`);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: allowCredentials,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400,
  };
}

// ============================================================================
// Security Configuration (Helmet)
// ============================================================================
function helmetOptions() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  };
}

// ============================================================================
// Middleware Utilities
// ============================================================================
function httpLogger() {
  return morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
    skip: (req) => req.url === "/api/health" || req.url === "/",
  });
}

function requestId() {
  return (req, res, next) => {
    req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader("X-Request-Id", req.id);
    next();
  };
}

function requestTimeout() {
  return (req, res, next) => {
    const timeout = CONFIG.REQUEST_TIMEOUT || 30000;
    req.setTimeout(timeout, () => {
      logger.warn(`⏱️ Request timeout: ${req.method} ${req.url}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: "Request timeout",
        });
      }
    });
    next();
  };
}

function slowRequestMonitor() {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > 3000) {
        logger.warn(
          `🐌 Slow request: ${req.method} ${req.url} took ${duration}ms`
        );
      }
    });
    next();
  };
}

function trimBodyStrings() {
  return (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === "string") {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    next();
  };
}

// ============================================================================
// Express App Builder
// ============================================================================
function buildExpressApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("etag", false);
  app.disable("x-powered-by");

  // 1) Security headers
  app.use(helmet(helmetOptions()));

  // 2) CORS must be early
  const c = cors(corsOptions());
  app.use(c);

  // Explicit preflight support (safe to include)
  app.options("*", c);

  // 3) Compression
  app.use(
    compression({
      filter: (req, res) =>
        req.headers["x-no-compression"] ? false : compression.filter(req, res),
      level: CONFIG.COMPRESSION_LEVEL || 6,
      threshold: 1024,
    })
  );

  // 4) Body parsing
  app.use(express.json({ limit: CONFIG.MAX_FILE_SIZE || "10mb" }));
  app.use(express.urlencoded({ limit: CONFIG.MAX_FILE_SIZE || "10mb", extended: true }));

  // 5) Observability
  app.use(httpLogger());
  app.use(requestId());
  app.use(requestTimeout());
  app.use(slowRequestMonitor());

  // 6) Sanitization
  app.use(trimBodyStrings());

  // 7) Static
  app.use(
    "/uploads",
    express.static(UPLOAD_BASE, {
      maxAge: CONFIG.IS_PRODUCTION ? CONFIG.CACHE_MAX_AGE || "1d" : 0,
      etag: false,
      lastModified: true,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (CONFIG.IS_DEVELOPMENT) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        }
      },
    })
  );

  // 8) Health checks (before limiter)
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Backend API is running",
      service: "Complaint Management System",
      version: CONFIG.API_VERSION || "1.0.0",
      environment: CONFIG.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  });

  app.head("/", (req, res) => res.status(200).end());

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "API is healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // 9) Rate limit /api BUT SKIP OPTIONS (preflight)
  app.use("/api", (req, res, next) => {
    if (req.method === "OPTIONS") return next();
    return apiLimiter(req, res, next);
  });

  // 10) Routes
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  attachRoutes(app);

  // 11) Errors last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildExpressApp;
