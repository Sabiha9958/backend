// controllers/complaints/complaints.helpers.js

const fs = require("fs");
const path = require("path");
const { StatusCodes } = require("http-status-codes");
const Complaint = require("../../models/complaint/complaint.model");
const logger = require("../../utils/logging/logger");
const { broadcast } = require("../../utils/websocket/index");

const sendErrorResponse = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

const cleanupFiles = (files) => {
  if (!Array.isArray(files)) return;

  files.forEach((file) => {
    try {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      logger.warn(`Failed to cleanup file: ${file?.path}`, err);
    }
  });
};

const broadcastComplaintEvent = (type, complaint, extra = {}) => {
  try {
    const payload =
      complaint && typeof complaint.toObject === "function"
        ? complaint.toObject()
        : complaint;

    broadcast({
      type,
      data: {
        ...payload,
        ...extra,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn(
      `Failed to broadcast complaint event "${type}" for ${complaint?._id}:`,
      err.message
    );
  }
};

module.exports = {
  fs,
  path,
  StatusCodes,
  Complaint,
  logger,
  broadcastComplaintEvent,
  sendErrorResponse,
  cleanupFiles,
};
