const express = require("express");
const router = express.Router();

const { reportController } = require("../../controllers");
const { protect, authorize } = require("../../middleware");
const {
  sensitiveLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");

// Get complaint statistics report
router.get(
  "/complaints",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  reportController.getComplaintStatsReport
);

// Export complaint stats as CSV
router.get(
  "/complaints/export/csv",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  reportController.exportComplaintStatsCSV
);

// Export complaint stats as Excel
router.get(
  "/complaints/export/excel",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  reportController.exportComplaintStatsExcel
);

module.exports = router;
