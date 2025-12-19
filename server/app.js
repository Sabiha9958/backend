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

function buildAllowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS;
  if (!env) {
    return [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ];
  }
  return env.split(",").map((o) => o.trim());
}

function corsOptions() {
  const allowedOrigins = buildAllowedOrigins();

  return {
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      logger.warn(`🚫 CORS blocked: ${origin}`);
      return callback(
        new Error(`CORS policy violation: ${origin} not allowed`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range", "X-Request-Id"],
    maxAge: 86400,
  };
}

function helmetOptions() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        fontSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        // helmet expects an array or undefined; avoid null
        ...(CONFIG.IS_PRODUCTION ? {} : { upgradeInsecureRequests: null }),
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: CONFIG.IS_PRODUCTION
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  };
}

function requestId() {
  return (req, res, next) => {
    req.id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    res.setHeader("X-Request-Id", req.id);
    next();
  };
}

function requestTimeout() {
  return (req, res, next) => {
    req.setTimeout(CONFIG.REQUEST_TIMEOUT, () => {
      logger.error(`⏱️ Timeout: ${req.method} ${req.originalUrl}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: "Request timeout",
          code: "REQUEST_TIMEOUT",
          requestId: req.id,
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
      if (duration > 5000) {
        logger.error(
          `🐌 Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`
        );
      } else if (duration > 3000) {
        logger.warn(
          `⚠️ Very slow request: ${req.method} ${req.originalUrl} - ${duration}ms`
        );
      }
    });
    next();
  };
}

function trimBodyStrings() {
  return (req, _res, next) => {
    if (!req.body || typeof req.body !== "object") return next();

    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    }
    next();
  };
}

function httpLogger() {
  if (CONFIG.IS_DEVELOPMENT) return morgan("dev");
  return morgan("combined", {
    stream: logger.stream,
    skip: (req) => req.url === "/api/health",
  });
}

function buildExpressApp() {
  const app = express();

  // Core app settings
  app.set("trust proxy", 1);
  app.set("etag", false);

  // Security + platform middleware
  app.use(helmet(helmetOptions()));
  app.use(cors(corsOptions()));
  app.use(
    compression({
      filter: (req, res) =>
        req.headers["x-no-compression"] ? false : compression.filter(req, res),
      level: CONFIG.COMPRESSION_LEVEL,
      threshold: 1024,
    })
  );

  // Body parsing
  app.use(express.json({ limit: CONFIG.MAX_FILE_SIZE }));
  app.use(express.urlencoded({ limit: CONFIG.MAX_FILE_SIZE, extended: true }));

  // Observability
  app.use(httpLogger());
  app.use(requestId());
  app.use(requestTimeout());
  app.use(slowRequestMonitor());

  // Input hygiene
  app.use(trimBodyStrings());

  // Static files
  app.use(
    "/uploads",
    express.static(UPLOAD_BASE, {
      maxAge: CONFIG.IS_PRODUCTION ? CONFIG.CACHE_MAX_AGE : 0,
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

  // Rate limiting (apply to all /api routes)
  app.use("/api", apiLimiter);

  // Routes (mount “simple” routers first, then the rest)
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  attachRoutes(app);

  // Errors (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildExpressApp;
