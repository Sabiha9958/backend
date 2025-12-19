// src/utils/websocket/websocketServer.js
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const logger = require("../logging/logger");

// Initialize WebSocket server
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({
    noServer: true,
    path: "/ws/complaints",
  });

  // HTTP upgrade to WS
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === "/ws/complaints") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // New connection handler
  wss.on("connection", async (ws, request) => {
    logger.info("✅ New WebSocket connection established");

    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ws.userId = decoded.id;
        ws.userRole = decoded.role;
        logger.info(`🔐 WebSocket authenticated for user: ${ws.userId}`);
      } else {
        logger.info("🔓 WebSocket connection without authentication");
      }
    } catch (error) {
      logger.warn(`⚠️ WebSocket authentication failed: ${error.message}`);
    }

    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to real-time updates",
        timestamp: new Date().toISOString(),
      })
    );

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`📨 WebSocket message received: ${JSON.stringify(data)}`);

        switch (data.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;
          case "subscribe":
            ws.subscribe = data.channel || "complaints";
            logger.info(`📡 Client subscribed to: ${ws.subscribe}`);
            ws.send(
              JSON.stringify({
                type: "subscribed",
                channel: ws.subscribe,
                message: `Subscribed to ${ws.subscribe} updates`,
              })
            );
            break;
          case "unsubscribe":
            logger.info(`🔕 Client unsubscribed from: ${ws.subscribe}`);
            ws.subscribe = null;
            break;
          default:
            logger.warn(`⚠️ Unknown message type: ${data.type}`);
        }
      } catch (error) {
        logger.error("❌ Error parsing WebSocket message:", error);
      }
    });

    ws.on("error", (error) => {
      logger.error("❌ WebSocket error:", error);
    });

    ws.on("close", () => {
      logger.info("🔌 WebSocket connection closed");
    });

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.warn("💀 Terminating inactive WebSocket connection");
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
    logger.info("🔌 WebSocket server closed");
  });

  logger.info("🚀 WebSocket server initialized");

  return wss;
};

module.exports = initializeWebSocket;
