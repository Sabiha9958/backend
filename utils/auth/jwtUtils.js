// src/utils/auth/jwtUtils.js
const { TOKEN_CONFIG } = require("./jwtConfig");
const {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
} = require("./jwtTokens");
const {
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  extractToken,
} = require("./jwtVerify");
const { setAuthCookies, clearAuthCookies } = require("./jwtCookies");

// issue tokens, set cookies, and return tokens
const issueTokensAndSetCookies = (user, res) => {
  const { accessToken, refreshToken } = generateTokenPair(user);
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
};

module.exports = {
  TOKEN_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  issueTokensAndSetCookies,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  setAuthCookies,
  clearAuthCookies,
  extractToken,
};
