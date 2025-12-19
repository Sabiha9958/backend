const rateLimit = require("express-rate-limit");
const logger = require("../../utils/logging/logger");

// ---------- helpers ----------
const isDev = process.env.NODE_ENV !== "production";

const isPrivileged = (req) => {
  const role = req?.user?.role;
  return role === "admin" || role === "staff";
};

// Get stable client id:
// - if behind proxy and trust proxy is enabled, req.ip will be client ip
// - normalize localhost ipv6 (::1) and ipv4-mapped ipv6 (::ffff:127.0.0.1)
const getClientId = (req) => {
  let ip = req.ip || "";
  if (ip === "::1") ip = "127.0.0.1";
  ip = ip.replace("::ffff:", "");

  // If you DO NOT use a proxy, ignore x-forwarded-for.
  // If you DO use a proxy, set `app.set('trust proxy', 1)` and req.ip will be correct. [web:301]
  return ip || "unknown";
};

// ---------- factory ----------
const createLimiter = (opts = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100, // for express-rate-limit v6
    limit, // for v7+
    message = "Too many requests. Please try again later.",
    skip = () => false,
    keyGenerator = getClientId,
    privilegedUnlimited = true, // ✅ admin/staff bypass
    disableInDev = false, // ✅ optional
  } = opts;

  return rateLimit({
    windowMs,

    // Support both versions (v6 uses max, v7 uses limit). [web:313][web:302]
    ...(typeof limit === "number" ? { limit } : { max }),

    keyGenerator,

    // Skip if: dev disabled OR privileged OR custom skip
    skip: (req, res) => {
      if (disableInDev && isDev) return true;
      if (privilegedUnlimited && isPrivileged(req)) return true; // ✅ unlimited admin/staff [web:313]
      return skip(req, res);
    },

    standardHeaders: "draft-8", // modern RateLimit headers [web:313]
    legacyHeaders: false,

    handler: (req, res /*, next, options */) => {
      const id = keyGenerator(req);
      logger.warn(`Rate limit exceeded for ${id}`);

      return res.status(429).json({
        success: false,
        message,
        code: "RATE_LIMIT_EXCEEDED",
      });
    },
  });
};

// ---------- pre-made limiters ----------
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts. Please try again later.",
  privilegedUnlimited: false, // auth routes usually should still be limited
  disableInDev: true, // optional: disable auth limiter locally
});

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300, // raise this; 100 is low for dashboards
  message: "Too many requests. Please try again later.",
  privilegedUnlimited: true, // ✅ admin/staff unlimited
  disableInDev: false, // keep on if you want
});

const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many uploads. Please try again later.",
  privilegedUnlimited: true,
});

const sensitiveLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many sensitive operations. Please try again later.",
  privilegedUnlimited: true,
});

module.exports = {
  createLimiter,
  getClientId,
  isPrivileged,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  sensitiveLimiter,
};
