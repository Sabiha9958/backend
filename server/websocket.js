const http = require("http");
const { initializeWebSocket, broadcast } = require("../utils/websocket");
const logger = require("../utils/logging/logger");

// Create HTTP + WebSocket server
const createServerWithWebSocket = (app) => {
  const server = http.createServer(app);
  const wss = initializeWebSocket(server);

  logger.info("✅ WebSocket server initialized on path: /ws/complaints");

  const broadcastComplaint = (type, data, channel = "complaints") => {
    broadcast(
      wss,
      {
        type,
        data,
        timestamp: new Date().toISOString(),
      },
      channel
    );
  };

  return { server, wss, broadcastComplaint };
};

module.exports = createServerWithWebSocket;
