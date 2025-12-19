// src/utils/auth/jwtVerify.js
const jwt = require("jsonwebtoken");
const {
  TOKEN_CONFIG,
  JWT_ISSUER,
  JWT_AUDIENCE,
  getSecret,
  handleVerificationError,
} = require("./jwtConfig");

// Generic verify
const verifyToken = (token, isRefresh = false) => {
  if (!token) {
    throw new Error("Token is required for verification");
  }

  const envKey = isRefresh
    ? TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV_KEY
    : TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV_KEY;

  const secret = getSecret(envKey);

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const expectedType = isRefresh ? "refresh" : "access";
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType} token`);
    }

    return decoded;
  } catch (error) {
    return handleVerificationError(error);
  }
};

// Verify access token
const verifyAccessToken = (token) => verifyToken(token, false);

// Verify refresh token
const verifyRefreshToken = (token) => verifyToken(token, true);

// Decode token (non secure)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error("❌ Token decode error:", error.message);
    return null;
  }
};

// Get expiration date
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : null;
};

// Check if expired
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};

// Extract token from header or cookies
const extractToken = (req, isRefresh = false) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieName = isRefresh
    ? TOKEN_CONFIG.COOKIE.REFRESH_NAME
    : TOKEN_CONFIG.COOKIE.ACCESS_NAME;

  return req.cookies?.[cookieName] || null;
};

module.exports = {
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  extractToken,
};
