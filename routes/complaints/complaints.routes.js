const express = require("express");
const router = express.Router();

const { router: baseRouter } = require("./complaints.base.routes");
const statusRoutes = require("./complaints.status.routes");
const commentsRoutes = require("./complaints.comments.routes");
const attachmentsRoutes = require("./complaints.attachments.routes");
const adminRoutes = require("./complaints.admin.routes");

// Mount segments
router.use(baseRouter);
router.use(statusRoutes);
router.use(commentsRoutes);
router.use(attachmentsRoutes);
router.use(adminRoutes);

module.exports = router;
