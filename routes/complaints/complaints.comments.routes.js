const express = require("express");
const router = express.Router();

const { complaintController } = require("../../controllers");
const { protect } = require("../../middleware/auth/auth.middleware");
const { commentValidator } = require("../../middleware");
const { apiLimiter } = require("../../middleware/rate/rateLimiter.middleware");
const { checkComplaintOwnership } = require("./complaints.base.routes");

// Get all comments for a complaint
router.get(
  "/:id/comments",
  protect,
  checkComplaintOwnership,
  complaintController.getComplaintComments
);

// Add a comment to a complaint
router.post(
  "/:id/comments",
  protect,
  apiLimiter,
  checkComplaintOwnership,
  commentValidator,
  complaintController.addComplaintComment
);

module.exports = router;
