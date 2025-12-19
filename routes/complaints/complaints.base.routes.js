const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth/auth.middleware");
const {
  complaintCreateValidator,
  complaintUpdateValidator,
  paginationValidator,
} = require("../../middleware");

const {
  uploadComplaintAttachments,
  handleMulterError,
  cleanupUploadedFiles,
} = require("../../middleware/upload/upload.middleware");

const {
  uploadLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");

const Complaint = require("../../models/complaint/complaint.model");
const {
  listComplaints,
  getComplaintStats,
} = require("../../controllers/complaints/complaintController");

const checkComplaintOwnership = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });

    const isAdminOrStaff = ["admin", "staff"].includes(req.user?.role);
    const isOwner =
      String(complaint.user || "") === String(req.user?._id || "");

    if (!isAdminOrStaff && !isOwner) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to access this complaint",
        });
    }

    req.complaint = complaint;
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/stats", protect, getComplaintStats);

router.get("/", protect, paginationValidator, listComplaints);

router.get(
  "/my",
  protect,
  paginationValidator,
  require("../../controllers").complaintController.getMyComplaints
);

router.post(
  "/",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadComplaintAttachments,
  handleMulterError,
  complaintCreateValidator,
  require("../../controllers").complaintController.createComplaint
);

router.get(
  "/:id",
  protect,
  checkComplaintOwnership,
  require("../../controllers").complaintController.getComplaintById
);

router.put(
  "/:id",
  protect,
  checkComplaintOwnership,
  complaintUpdateValidator,
  require("../../controllers").complaintController.updateComplaint
);

router.delete(
  "/:id",
  protect,
  checkComplaintOwnership,
  require("../../controllers").complaintController.deleteComplaint
);

module.exports = { router, checkComplaintOwnership };
