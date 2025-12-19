const express = require("express");
const router = express.Router();

const { complaintController } = require("../../controllers");
const { protect } = require("../../middleware/auth/auth.middleware");
const {
  uploadLimiter,
  sensitiveLimiter,
} = require("../../middleware/rate/rateLimiter.middleware");
const {
  uploadComplaintAttachments,
  handleMulterError,
  cleanupUploadedFiles,
} = require("../../middleware/upload/upload.middleware");
const { checkComplaintOwnership } = require("./complaints.base.routes");

// Download attachment
router.get(
  "/:id/attachments/:attachmentId",
  protect,
  checkComplaintOwnership,
  complaintController.downloadComplaintAttachment
);

// Add attachments to existing complaint
router.post(
  "/:id/attachments",
  protect,
  uploadLimiter,
  checkComplaintOwnership,
  cleanupUploadedFiles,
  uploadComplaintAttachments,
  handleMulterError,
  async (req, res) => {
    try {
      const complaint = req.complaint;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const currentCount = complaint.attachments?.length || 0;
      if (currentCount + req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: "Maximum 5 attachments allowed per complaint",
        });
      }

      for (const file of req.files) {
        await complaint.addAttachment(file, req);
      }

      await complaint.save();

      res.status(201).json({
        success: true,
        message: "Attachments added successfully",
        data: complaint,
      });
    } catch (error) {
      console.error("Add attachment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add attachments",
      });
    }
  }
);

// Delete attachment from complaint
router.delete(
  "/:id/attachments/:attachmentId",
  protect,
  sensitiveLimiter,
  checkComplaintOwnership,
  async (req, res) => {
    try {
      const complaint = req.complaint;
      const { attachmentId } = req.params;

      await complaint.deleteAttachment(attachmentId);
      await complaint.save();

      res.json({
        success: true,
        message: "Attachment deleted successfully",
      });
    } catch (error) {
      console.error("Delete attachment error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete attachment",
      });
    }
  }
);

module.exports = router;
