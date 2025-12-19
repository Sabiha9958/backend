// controllers/complaints/complaints.create.controller.js

const {
  StatusCodes,
  Complaint,
  logger,
  broadcastComplaintEvent,
  sendErrorResponse,
  cleanupFiles,
} = require("./complaints.helpers");

exports.createComplaint = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      cleanupFiles(req.files);
      return sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "User not authenticated."
      );
    }

    let { title, description, category, priority, contactInfo } = req.body;

    if (!title?.trim() || !description?.trim()) {
      cleanupFiles(req.files);
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Title and description are required."
      );
    }

    if (typeof contactInfo === "string") {
      try {
        contactInfo = JSON.parse(contactInfo);
      } catch {
        cleanupFiles(req.files);
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Invalid contact info format."
        );
      }
    }

    if (!contactInfo) {
      contactInfo = {
        name: req.user.name || "",
        email: req.user.email || "",
        phone: req.user.phone || "",
      };
    }

    if (!contactInfo.name?.trim() || !contactInfo.email?.trim()) {
      cleanupFiles(req.files);
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Contact name and email are required."
      );
    }

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const complaintData = {
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || "other",
      priority: priority?.trim() || "medium",
      user: req.user._id,
      contactInfo: {
        name: contactInfo.name.trim(),
        email: contactInfo.email.trim().toLowerCase(),
        phone: contactInfo.phone?.trim() || "",
      },
      status: "pending",
      attachments: [],
    };

    if (Array.isArray(req.files) && req.files.length > 0) {
      complaintData.attachments = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `${baseUrl}/uploads/complaints/${file.filename}`,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      }));
    }

    const complaint = await Complaint.create(complaintData);
    await complaint.populate("user", "name email role avatar");

    logger.info(
      `Complaint created by ${req.user.email} (ID: ${complaint._id}) with ${complaintData.attachments.length} attachment(s)`
    );

    broadcastComplaintEvent("NEW_COMPLAINT", complaint);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Complaint submitted successfully.",
      data: complaint,
      complaintId: complaint._id,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      cleanupFiles(req.files);
      logger.error("Create complaint validation error:", error);
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message || "Invalid complaint data."
      );
    }

    cleanupFiles(req.files);
    logger.error("Create complaint error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to create complaint."
    );
  }
};
