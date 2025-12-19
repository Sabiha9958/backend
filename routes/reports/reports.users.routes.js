const express = require("express");
const router = express.Router();

const { reportController } = require("../../controllers");
const { protect, authorize, paginationValidator } = require("../../middleware");
const {
  sensitiveLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");

// Get user statistics report
router.get(
  "/users",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  paginationValidator,
  reportController.getUserStatsReport
);

// Export user stats as CSV
router.get(
  "/users/export/csv",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  reportController.exportUserStatsCSV
);

// Export user stats as Excel
router.get(
  "/users/export/excel",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  reportController.exportUserStatsExcel
);

module.exports = router;
