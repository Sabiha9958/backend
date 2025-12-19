// controllers/complaints/complaints.comments.controller.js

const {
  StatusCodes,
  Complaint,
  logger,
  broadcastComplaintEvent,
  sendErrorResponse,
} = require("./complaints.helpers");

// Add a new comment
exports.addComplaintComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Comment text is required."
      );
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const isOwner = complaint.user.toString() === req.user._id.toString();
    const isStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to comment on this complaint."
      );
    }

    const newComment = await complaint.addComment(
      req.user._id,
      comment,
      isStaff
    );

    await complaint.populate("comments.user", "name email role avatar");

    logger.info(
      `Comment added to complaint ${complaint._id} by ${req.user.email}`
    );

    broadcastComplaintEvent("NEW_COMMENT", {
      complaintId: complaint._id,
      comment: newComment,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Comment added successfully.",
      data: newComment,
    });
  } catch (error) {
    logger.error("Add comment error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to add comment."
    );
  }
};

// Get all comments for a complaint
exports.getComplaintComments = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .select("comments")
      .populate("comments.user", "name email role avatar");

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      count: complaint.comments.length,
      data: complaint.comments,
    });
  } catch (error) {
    logger.error("Get comments error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch comments."
    );
  }
};
