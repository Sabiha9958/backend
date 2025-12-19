// src/utils/auth/jwtTokens.js
const jwt = require("jsonwebtoken");
const {
  TOKEN_CONFIG,
  JWT_ISSUER,
  JWT_AUDIENCE,
  getSecret,
} = require("./jwtConfig");

// sign access token
const generateAccessToken = (
  payload,
  expiresIn = TOKEN_CONFIG.ACCESS_TOKEN.EXPIRY
) => {
  const secret = getSecret(TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV_KEY);

  const tokenPayload = {
    ...payload,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

// sign refresh token
const generateRefreshToken = (
  payload,
  expiresIn = TOKEN_CONFIG.REFRESH_TOKEN.EXPIRY
) => {
  const secret = getSecret(TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV_KEY);

  const tokenPayload = {
    id: payload.id,
    type: "refresh",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

// build access+refresh pair for a user object
const generateTokenPair = (user) => {
  const userId = user.id || user._id;

  const accessPayload = {
    id: userId,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const refreshPayload = { id: userId };

  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken(refreshPayload),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
};
