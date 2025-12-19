const Complaint = require("../../models/complaint/complaint.model");

const safeInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const safeNum = (v, fallback = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const listComplaints = async (req, res, next) => {
  try {
    const page = Math.max(safeInt(req.query.page, 1), 1);
    const limit = Math.min(Math.max(safeInt(req.query.limit, 25), 1), 100);

    const sort =
      typeof req.query.sort === "string" && req.query.sort.trim()
        ? req.query.sort.trim()
        : "-createdAt";
    const filter = {};

    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.json({
      complaints,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (err) {
    next(err);
  }
};

const getComplaintStats = async (req, res, next) => {
  try {
    const start = startOfToday();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const statusRows = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }, // group counts [web:110]
    ]); // aggregate returns array [web:162]

    const resolvedTodayAgg = await Complaint.aggregate([
      { $match: { status: "resolved", updatedAt: { $gte: start, $lt: end } } },
      { $count: "count" }, // returns [{count:n}] [web:105]
    ]);

    const counts = statusRows.reduce((acc, row) => {
      acc[String(row._id)] = safeNum(row.count, 0);
      return acc;
    }, {});

    const totalComplaints = Object.values(counts).reduce(
      (a, b) => a + safeNum(b, 0),
      0
    );
    const resolvedCount = safeNum(counts.resolved, 0);
    const completionRate = totalComplaints
      ? (resolvedCount / totalComplaints) * 100
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        openCount: safeNum(counts.open, 0),
        pendingCount: safeNum(counts.pending, 0),
        inProgressCount: safeNum(counts.in_progress ?? counts.inProgress, 0),
        resolvedCount,
        rejectedCount: safeNum(counts.rejected, 0),
        closedCount: safeNum(counts.closed, 0),
        resolvedToday: safeNum(resolvedTodayAgg?.[0]?.count, 0),
        completionRate,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listComplaints, getComplaintStats };
