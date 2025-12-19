const logger = require("../../utils/logging/logger");

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code || "SERVER_ERROR",
  });
};

module.exports = { notFound, errorHandler };
