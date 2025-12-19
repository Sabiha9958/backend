const express = require("express");
const router = express.Router();

const { complaintController } = require("../../controllers");
const { protect, authorize } = require("../../middleware");
const { complaintStatusValidator } = require("../../middleware");
const {
  sensitiveLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");
const Complaint = require("../../models/complaint/complaint.model");

// User stats (for current logged-in user)
router.get("/stats/user", protect, async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const result = {
      total,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      result[stat._id] = stat.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching user complaint stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
});

// Admin/staff stats overview
router.get(
  "/stats",
  protect,
  authorize("admin", "staff"),
  complaintController.getComplaintStatsOverview
);

// Update complaint status (admin/staff only)
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  complaintStatusValidator,
  complaintController.updateComplaintStatus
);

module.exports = router;
