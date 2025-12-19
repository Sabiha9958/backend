// controllers/reports/reports.complaints.controller.js

const Complaint = require("../../models/complaint/complaint.model");
const logger = require("../../utils/logging/logger");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

// Complaint stats (JSON)
exports.getComplaintStatsReport = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const result = {
      total: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      closed: 0,
    };

    stats.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });

    return res.status(200).json({ success: true, stats: result });
  } catch (error) {
    logger.error("Get complaint stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint statistics.",
    });
  }
};

// Complaint stats CSV
exports.exportComplaintStatsCSV = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const parser = new Parser({ fields: ["_id", "count"] });
    const csv = parser.parse(stats);

    res.header("Content-Type", "text/csv");
    res.attachment("complaint-stats.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("Export complaint stats CSV error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export complaint stats CSV",
    });
  }
};

// Complaint stats Excel
exports.exportComplaintStatsExcel = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const worksheet = XLSX.utils.json_to_sheet(stats);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "ComplaintStats");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.attachment("complaint-stats.xlsx");
    return res.send(buffer);
  } catch (error) {
    logger.error("Export complaint stats Excel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export complaint stats Excel",
    });
  }
};
