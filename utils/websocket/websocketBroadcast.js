// src/utils/websocket/websocketBroadcast.js
const WebSocket = require("ws");
const logger = require("../logging/logger");

// Broadcast to all or channel
const broadcast = (wss, data, channel = null) => {
  if (!wss || !wss.clients) {
    logger.warn("⚠️ WebSocket server not available for broadcast");
    return;
  }

  const message = JSON.stringify({
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  });

  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!channel || client.subscribe === channel) {
        client.send(message);
        sentCount++;
      }
    }
  });

  logger.info(`📢 Broadcast to ${sentCount} client(s) - Type: ${data.type}`);
};

// Send to specific user
const sendToUser = (wss, userId, data) => {
  if (!wss || !wss.clients) {
    logger.warn("⚠️ WebSocket server not available for user message");
    return;
  }

  const message = JSON.stringify({
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  });

  let sent = false;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(message);
      sent = true;
    }
  });

  if (sent) {
    logger.info(`📨 Message sent to user ${userId} - Type: ${data.type}`);
  } else {
    logger.warn(`⚠️ User ${userId} not connected or not found`);
  }
};

// Get connected clients count
const getConnectedCount = (wss) => {
  if (!wss || !wss.clients) return 0;
  return Array.from(wss.clients).filter(
    (client) => client.readyState === WebSocket.OPEN
  ).length;
};

module.exports = {
  broadcast,
  sendToUser,
  getConnectedCount,
};
