// controllers/complaints/complaints.update.controller.js

const {
  StatusCodes,
  Complaint,
  logger,
  broadcastComplaintEvent,
  sendErrorResponse,
} = require("./complaints.helpers");

// Update complaint fields or staff notes/status
exports.updateComplaint = async (req, res) => {
  try {
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

    if (isOwner && complaint.status === "pending") {
      const allowedUpdates = ["title", "description", "category", "priority"];

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          complaint[field] = req.body[field];
        }
      });
    } else if (isStaff) {
      if (req.body.status) {
        await complaint.updateStatus(
          req.body.status,
          req.user._id,
          req.body.statusNote
        );
      }

      if (req.body.notes !== undefined) {
        complaint.notes = req.body.notes.trim();
      }

      if (req.body.assignedTo) {
        complaint.assignedTo = req.body.assignedTo;
      }
    } else {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to update this complaint."
      );
    }

    await complaint.save();

    logger.info(`Complaint ${complaint._id} updated by ${req.user.email}`);

    broadcastComplaintEvent("UPDATED_COMPLAINT", complaint);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Complaint updated successfully.",
      data: complaint,
    });
  } catch (error) {
    logger.error("Update complaint error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update complaint."
    );
  }
};

// Update only the status of a complaint
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Status is required."
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

    await complaint.updateStatus(status, req.user._id, note);

    logger.info(
      `Complaint ${complaint._id} status updated to ${status} by ${req.user.email}`
    );

    broadcastComplaintEvent("UPDATED_COMPLAINT", complaint, {
      statusChanged: true,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Complaint status updated successfully.",
      data: complaint,
    });
  } catch (error) {
    logger.error("Update complaint status error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update complaint status."
    );
  }
};

// Delete a complaint (with rules)
exports.deleteComplaint = async (req, res) => {
  try {
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
        "Not authorized to delete this complaint."
      );
    }

    if (isOwner && complaint.status !== "pending") {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Can only delete pending complaints."
      );
    }

    const deletedId = complaint._id;

    await complaint.deleteOne();

    logger.info(`Complaint ${deletedId} deleted by ${req.user.email}`);

    broadcastComplaintEvent("DELETED_COMPLAINT", { _id: deletedId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error) {
    logger.error("Delete complaint error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete complaint."
    );
  }
};
