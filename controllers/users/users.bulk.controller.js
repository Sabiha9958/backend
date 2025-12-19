// controllers/users/users.bulk.controller.js

const { User, asyncHandler, logAuditEvent } = require("./users.helpers");

// POST /api/v1/users/bulk
exports.adminBulkUserAction = asyncHandler(async (req, res) => {
  const { userIds, action } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of user IDs",
    });
  }

  if (userIds.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: "Cannot perform action on your own account",
    });
  }

  let result;
  let message;

  switch (action) {
    case "delete":
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: { $ne: true } },
        {
          isDeleted: true,
          deletedAt: Date.now(),
          deletedBy: req.user.id,
          isActive: false,
        }
      );
      message = `${result.modifiedCount} user(s) deleted successfully`;
      break;

    case "activate":
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: { $ne: true } },
        { isActive: true }
      );
      message = `${result.modifiedCount} user(s) activated successfully`;
      break;

    case "deactivate":
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: { $ne: true } },
        { isActive: false }
      );
      message = `${result.modifiedCount} user(s) deactivated successfully`;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use: delete, activate, or deactivate",
      });
  }

  await logAuditEvent({
    action: `BULK_USER_${action.toUpperCase()}`,
    performedBy: req.user._id,
    targetUserIds: userIds,
    requestedCount: userIds.length,
    modifiedCount: result.modifiedCount,
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message,
    data: {
      requestedCount: userIds.length,
      modifiedCount: result.modifiedCount,
    },
  });
});
