const express = require("express");
const router = express.Router();
const {
  getRoles,
  getRole,
  createRole,
  updateRolePermissions,
  deleteRole,
} = require("../../controllers/role/roleController");

// Add your auth middleware here if needed
// const { protect, authorize } = require('../middleware/auth');

// Public routes (add auth middleware as needed)
router.get("/", getRoles);
router.get("/:id", getRole);
router.post("/", createRole);
router.patch("/:id/permissions", updateRolePermissions);
router.delete("/:id", deleteRole);

module.exports = router;
