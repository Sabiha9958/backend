// src/utils/websocket/index.js
const initializeWebSocket = require("./websocketServer");
const {
  broadcast,
  sendToUser,
  getConnectedCount,
} = require("./websocketBroadcast");

module.exports = {
  initializeWebSocket,
  broadcast,
  sendToUser,
  getConnectedCount,
};
