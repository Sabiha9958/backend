const mongoose = require("mongoose");
const logger = require("../utils/logging/logger");

// Graceful shutdown
const gracefulShutdown = async (signal, server, wss) => {
  logger.info(`🛑 ${signal} received - Starting graceful shutdown...`);

  let exitCode = 0;

  try {
    // Close websocket clients
    if (wss) {
      wss.clients.forEach((client) => {
        try {
          client.close(1000, "Server shutting down");
        } catch (err) {
          logger.warn("Error closing WebSocket client:", err);
        }
      });
      logger.info("✅ WebSocket connections closed");
    }

    // Close HTTP server
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info("✅ HTTP server closed");
    }

    // Close Mongo connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      logger.info("✅ MongoDB connection closed");
    }
  } catch (error) {
    logger.error(`❌ Shutdown error: ${error.message}`, {
      stack: error.stack,
    });
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
};

module.exports = gracefulShutdown;
