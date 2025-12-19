// src/utils/index.js

// Logging
const logger = require("./logging/logger");

// Email
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("./email/emailService");
const createTransporter = require("./email/transporter");
const passwordResetTemplate = require("./email/templates/passwordReset");
const resetSuccessTemplate = require("./email/templates/resetSuccess");

// Auth / JWT
const jwtUtils = require("./auth/jwtUtils");
const { TOKEN_CONFIG } = require("./auth/jwtConfig");
const {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
} = require("./auth/jwtTokens");
const {
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  extractToken,
} = require("./auth/jwtVerify");
const { setAuthCookies, clearAuthCookies } = require("./auth/jwtCookies");

// Database seeder
const { importData, destroyData } = require("./db/seederUtils");

// WebSocket
const websocket = require("./websocket");
const initializeWebSocket = require("./websocket/websocketServer");
const {
  broadcast,
  sendToUser,
  getConnectedCount,
} = require("./websocket/websocketBroadcast");

// Grouped export for convenience
module.exports = {
  // Logger
  logger,

  // Email
  email: {
    sendPasswordResetEmail,
    sendPasswordResetConfirmation,
    createTransporter,
    templates: {
      passwordResetTemplate,
      resetSuccessTemplate,
    },
  },

  // Auth / JWT
  jwt: {
    TOKEN_CONFIG,
    ...jwtUtils,
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    getTokenExpiration,
    isTokenExpired,
    extractToken,
    setAuthCookies,
    clearAuthCookies,
  },

  // Seeder
  seeder: {
    importData,
    destroyData,
  },

  // WebSocket
  websocket: {
    ...websocket,
    initializeWebSocket,
    broadcast,
    sendToUser,
    getConnectedCount,
  },
};
