// src/utils/auth/jwtConfig.js

const TOKEN_CONFIG = {
  ACCESS_TOKEN: {
    EXPIRY: process.env.JWT_EXPIRES_IN || "15m",
    SECRET_ENV_KEY: "JWT_SECRET",
  },
  REFRESH_TOKEN: {
    EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    SECRET_ENV_KEY: "JWT_REFRESH_SECRET",
  },
  COOKIE: {
    ACCESS_NAME: "access_token",
    REFRESH_NAME: "refresh_token",
    ACCESS_MAX_AGE: 15 * 60 * 1000,
    REFRESH_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
  },
};

const JWT_ISSUER = process.env.JWT_ISSUER || "complaint-management-system";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "cms-users";

// Get secret from env
const getSecret = (envKey) => {
  const secret = process.env[envKey];
  if (!secret) {
    throw new Error(`❌ Missing ${envKey} environment variable`);
  }
  return secret;
};

// Map verification errors to custom error
const handleVerificationError = (error) => {
  const errorMap = {
    TokenExpiredError: {
      message: "Token has expired. Please log in again.",
      code: "TOKEN_EXPIRED",
      status: 401,
    },
    JsonWebTokenError: {
      message: "Invalid token. Authorization denied.",
      code: "INVALID_TOKEN",
      status: 401,
    },
    NotBeforeError: {
      message: "Token not yet valid.",
      code: "TOKEN_NOT_ACTIVE",
      status: 401,
    },
  };

  const mapped = errorMap[error.name] || {
    message: "Token verification failed.",
    code: "VERIFICATION_FAILED",
    status: 401,
  };

  const customError = new Error(mapped.message);
  customError.code = mapped.code;
  customError.status = mapped.status;
  throw customError;
};

module.exports = {
  TOKEN_CONFIG,
  JWT_ISSUER,
  JWT_AUDIENCE,
  getSecret,
  handleVerificationError,
};
