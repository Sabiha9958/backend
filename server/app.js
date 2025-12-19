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

// ----------------------------------------------------------------------------
// CORS
// ----------------------------------------------------------------------------
const DEFAULT_ALLOWED_ORIGINS = [
  "https://frontend-8if6.onrender.com",
  "https://backend-h5g5.onrender.com",
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

  return cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      logger.warn(`🚫 CORS blocked: ${origin}`);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400,
    optionsSuccessStatus: 204,
  });
}

// ----------------------------------------------------------------------------
// Helmet
// ----------------------------------------------------------------------------
function helmetOptions() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http:"], // ✅ allow http too
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  };
}

// ----------------------------------------------------------------------------
// App
// ----------------------------------------------------------------------------
function buildExpressApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("etag", false);
  app.disable("x-powered-by");

  const corsMw = makeCorsMiddleware();
  app.use(corsMw);
  app.options("*", corsMw);

  app.use(helmet(helmetOptions()));

  app.use(
    compression({
      filter: (req, res) =>
        req.headers["x-no-compression"] ? false : compression.filter(req, res),
      level: Number(CONFIG.COMPRESSION_LEVEL) || 6,
      threshold: 1024,
    })
  );

  const bodyLimit = CONFIG.MAX_FILE_SIZE || "10mb";
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ limit: bodyLimit, extended: true }));

  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
      skip: (req) => req.url === "/api/health" || req.url === "/",
    })
  );

  // Static uploads (works, but needs persistent storage on Render)
  app.use("/uploads", express.static(UPLOAD_BASE)); // express.static is the key part [web:89]

  app.get("/", (_req, res) => {
    res.status(200).json({ success: true, message: "Backend API is running" });
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ success: true, message: "API is healthy" });
  });

  app.use("/api", (req, res, next) => {
    if (req.method === "OPTIONS") return next();
    return apiLimiter(req, res, next);
  });

  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  attachRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildExpressApp;
