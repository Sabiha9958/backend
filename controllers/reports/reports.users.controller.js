// controllers/reports/reports.users.controller.js

const User = require("../../models/user/user.model");
const logger = require("../../utils/logging/logger");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

// User stats (JSON)
exports.getUserStatsReport = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const result = { total: 0, admin: 0, staff: 0, user: 0 };

    stats.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });

    return res.status(200).json({ success: true, stats: result });
  } catch (error) {
    logger.error("Get user stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics.",
    });
  }
};

// User stats CSV
exports.exportUserStatsCSV = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const parser = new Parser({ fields: ["_id", "count"] });
    const csv = parser.parse(stats);

    res.header("Content-Type", "text/csv");
    res.attachment("user-stats.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("Export user stats CSV error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export user stats CSV",
    });
  }
};

// User stats Excel
exports.exportUserStatsExcel = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const worksheet = XLSX.utils.json_to_sheet(stats);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "UserStats");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.attachment("user-stats.xlsx");
    return res.send(buffer);
  } catch (error) {
    logger.error("Export user stats Excel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export user stats Excel",
    });
  }
};
