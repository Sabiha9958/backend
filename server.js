// server.js
require("dotenv").config();

const startServer = require("./server/startup");
const logger = require("./utils/logging/logger");

startServer()
  .then(({ app, server, wss, broadcastComplaint }) => {
    module.exports = { app, server, wss, broadcastComplaint };
  })
  .catch((error) => {
    logger.error(`❌ Server startup failed: ${error.message}`);
    process.exit(1);
  });
