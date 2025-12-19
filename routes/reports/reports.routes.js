const express = require("express");
const router = express.Router();

const complaintRoutes = require("./reports.complaints.routes");
const userRoutes = require("./reports.users.routes");

// Mount segments
router.use(complaintRoutes);
router.use(userRoutes);

module.exports = router;
