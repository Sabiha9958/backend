// controllers/complaints/complaints.attachments.controller.js

const {
  fs,
  path,
  StatusCodes,
  Complaint,
  logger,
  sendErrorResponse,
} = require("./complaints.helpers");

// Download single attachment
exports.downloadComplaintAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const attachment = complaint.attachments.id(attachmentId);

    if (!attachment) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Attachment not found."
      );
    }

    const filePath = attachment.path
      ? attachment.path
      : path.join(process.cwd(), "uploads", "complaints", attachment.filename);

    if (!fs.existsSync(filePath)) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "File not found on server."
      );
    }

    return res.download(filePath, attachment.originalName);
  } catch (error) {
    logger.error("Download attachment error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to download attachment."
    );
  }
};
