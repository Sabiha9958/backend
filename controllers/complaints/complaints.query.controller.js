// controllers/complaints/complaints.query.controller.js

const {
  StatusCodes,
  Complaint,
  logger,
  sendErrorResponse,
} = require("./complaints.helpers");

// List complaints with filters and pagination
exports.getComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      department,
      search,
      sortBy = "-createdAt",
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department) query.department = department;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { "contactInfo.name": regex },
        { "contactInfo.email": regex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate("user", "name email role avatar")
        .populate("assignedTo", "name email role")
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(query),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      count: complaints.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: complaints,
    });
  } catch (error) {
    logger.error("Get complaints error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch complaints."
    );
  }
};

// List complaints created by current user
exports.getMyComplaints = async (req, res) => {
  try {
    const { status, sortBy = "-createdAt" } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const complaints = await Complaint.find(query)
      .populate("assignedTo", "name email role")
      .sort(sortBy)
      .lean();

    const stats = {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      in_progress: complaints.filter((c) => c.status === "in_progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      rejected: complaints.filter((c) => c.status === "rejected").length,
      closed: complaints.filter((c) => c.status === "closed").length,
    };

    return res.status(StatusCodes.OK).json({
      success: true,
      count: complaints.length,
      data: complaints,
      stats,
    });
  } catch (error) {
    logger.error("Get my complaints error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch your complaints."
    );
  }
};

// Get a single complaint with full details
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email role avatar phone")
      .populate("assignedTo", "name email role avatar")
      .populate("comments.user", "name email role avatar")
      .populate("statusHistory.changedBy", "name email role")
      .populate("resolvedBy", "name email role");

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const isOwner = complaint.user._id.toString() === req.user._id.toString();
    const isStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to view this complaint."
      );
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    logger.error("Get complaint error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch complaint."
    );
  }
};

// Stats grouped by status/category/priority
exports.getComplaintStatsOverview = async (req, res) => {
  try {
    const [statusStats, categoryStats, priorityStats, recentComplaints] =
      await Promise.all([
        Complaint.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Complaint.countDocuments({
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

    const total = await Complaint.countDocuments();

    const result = {
      total,
      recent: recentComplaints,
      byStatus: {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
        closed: 0,
      },
      byCategory: {},
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };

    statusStats.forEach(({ _id, count }) => {
      result.byStatus[_id] = count;
    });

    categoryStats.forEach(({ _id, count }) => {
      result.byCategory[_id] = count;
    });

    priorityStats.forEach(({ _id, count }) => {
      result.byPriority[_id] = count;
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Get complaint stats error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch complaint statistics."
    );
  }
};
