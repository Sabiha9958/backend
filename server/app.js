// backend/server/app.js
"use strict";

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
// CORS
// ============================================================================

const DEFAULT_ALLOWED_ORIGINS = [
  "https://frontend-8if6.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function buildAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return DEFAULT_ALLOWED_ORIGINS;

  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

function makeCorsMiddleware() {
  const allowedOrigins = buildAllowedOrigins();
  const credentials = true;

  // With credentials=true, you cannot return "*" for Access-Control-Allow-Origin
  if (credentials && allowedOrigins.includes("*")) {
    throw new Error(
      "Invalid CORS config: ALLOWED_ORIGINS cannot contain '*' when credentials=true"
    );
  }

  const options = {
    origin(origin, cb) {
      // Requests like curl/Postman often have no Origin
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      logger.warn(`🚫 CORS blocked: ${origin}`);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204, // good default for preflight success
  };

  return cors(options);
}

// ============================================================================
// Helmet
// ============================================================================

function helmetOptions() {
  // If you enable CSP, ensure connect-src allows your frontend & websocket if used
  // Otherwise browsers can block API calls at the CSP layer.
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        // Allow outgoing connections from pages served by backend (mostly relevant if backend serves UI)
        // Keeping it permissive enough to not break WS/API.
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  };
}

// ============================================================================
// Small utilities (unchanged behavior, cleaner)
// ============================================================================

function httpLogger() {
  return morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req) => req.url === "/api/health" || req.url === "/",
  });
}

function requestId() {
  return (req, res, next) => {
    req.id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    res.setHeader("X-Request-Id", req.id);
    next();
  };
}

function requestTimeout() {
  return (req, res, next) => {
    const timeout = Number(CONFIG.REQUEST_TIMEOUT) || 30000;

    req.setTimeout(timeout, () => {
      logger.warn(`⏱️ Request timeout: ${req.method} ${req.originalUrl}`);
      if (!res.headersSent) {
        res.status(408).json({ success: false, message: "Request timeout" });
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
          `🐌 Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`
        );
      }
    });

    next();
  };
}

function trimBodyStrings() {
  return (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      for (const key of Object.keys(req.body)) {
        if (typeof req.body[key] === "string") {
          req.body[key] = req.body[key].trim();
        }
      }
    }
    next();
  };
}

// ============================================================================
// App builder
// ============================================================================

function buildExpressApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("etag", false);
  app.disable("x-powered-by");

  // 1) CORS FIRST (critical for preflight)
  const corsMw = makeCorsMiddleware();
  app.use(corsMw);

  // Global preflight handler (safe, explicit)
  // When using app.use(cors(...)), preflight is already handled, but this helps
  // in cases where other middleware might short-circuit OPTIONS. [web:9]
  app.options("*", corsMw);

  // 2) Security headers (after CORS)
  app.use(helmet(helmetOptions()));

  // 3) Compression
  app.use(
    compression({
      filter: (req, res) =>
        req.headers["x-no-compression"] ? false : compression.filter(req, res),
      level: Number(CONFIG.COMPRESSION_LEVEL) || 6,
      threshold: 1024,
    })
  );

  // 4) Body parsing
  const bodyLimit = CONFIG.MAX_FILE_SIZE || "10mb";
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ limit: bodyLimit, extended: true }));

  // 5) Observability
  app.use(httpLogger());
  app.use(requestId());
  app.use(requestTimeout());
  app.use(slowRequestMonitor());

  // 6) Sanitization
  app.use(trimBodyStrings());

  // 7) Static uploads
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

  // 8) Health endpoints (before limiter)
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

  // 9) Rate limit ONLY real API calls (never preflight)
  app.use("/api", (req, res, next) => {
    if (req.method === "OPTIONS") return next();
    return apiLimiter(req, res, next);
  });

  // 10) Routes
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  attachRoutes(app);

  // 11) 404 + error handler last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildExpressApp;
