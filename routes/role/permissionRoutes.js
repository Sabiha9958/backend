const express = require("express");
const router = express.Router();
const {
  getPermissions,
  createPermission,
  deletePermission,
} = require("../../controllers/role/permissionController");

// Add your auth middleware here if needed
// const { protect, authorize } = require('../middleware/auth');

// Public routes (add auth middleware as needed)
router.get("/", getPermissions);
router.post("/", createPermission);
router.delete("/:id", deletePermission);

module.exports = router;
