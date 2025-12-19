const connectDB = require("../config/db");
const logger = require("../utils/logging/logger");

const {
  CONFIG,
  validateEnvironment,
  createUploadDirectories,
} = require("./config");

const buildExpressApp = require("./app");
const createServerWithWebSocket = require("./websocket");
const gracefulShutdown = require("./shutdown");

const startServer = async () => {
  try {
    // Silent validation and setup
    validateEnvironment();
    createUploadDirectories();

    const app = buildExpressApp();
    const { server, wss, broadcastComplaint } = createServerWithWebSocket(app);

    // Connect to database (logs internally)
    await connectDB();

    // Start server
 server.listen(CONFIG.PORT, () => {
  console.log(`\n🚀 Server running on port ${CONFIG.PORT}`);

  // Public (Render) endpoints for clients:
  console.log(`📡 API: https://backend-h5g5.onrender.com/api`);
  console.log(`🔌 WebSocket: wss://backend-h5g5.onrender.com/ws/complaints\n`);
});


    // Graceful shutdown
    ["SIGTERM", "SIGINT", "SIGUSR2"].forEach((signal) => {
      process.on(signal, () => gracefulShutdown(signal, server, wss));
    });

    // Error handlers
    process.on("uncaughtException", (error) => {
      logger.error("💥 Uncaught Exception:", {
        message: error.message,
        stack: error.stack,
      });
      gracefulShutdown("Uncaught Exception", server, wss);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("💥 Unhandled Rejection:", {
        reason: reason?.message || reason,
      });
      gracefulShutdown("Unhandled Rejection", server, wss);
    });

    return { app, server, wss, broadcastComplaint };
  } catch (error) {
    logger.error(`❌ Server startup failed: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }
};

module.exports = startServer;
