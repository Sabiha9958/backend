// src/utils/auth/jwtCookies.js
const { TOKEN_CONFIG } = require("./jwtConfig");

// Set auth cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.cookie(TOKEN_CONFIG.COOKIE.ACCESS_NAME, accessToken, {
    ...baseOptions,
    maxAge: TOKEN_CONFIG.COOKIE.ACCESS_MAX_AGE,
  });

  res.cookie(TOKEN_CONFIG.COOKIE.REFRESH_NAME, refreshToken, {
    ...baseOptions,
    maxAge: TOKEN_CONFIG.COOKIE.REFRESH_MAX_AGE,
  });
};

// Clear auth cookies
const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const opts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie(TOKEN_CONFIG.COOKIE.ACCESS_NAME, opts);
  res.clearCookie(TOKEN_CONFIG.COOKIE.REFRESH_NAME, opts);
};

module.exports = {
  setAuthCookies,
  clearAuthCookies,
};
