const Role = require("../../models/role/Role");

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch roles",
    });
  }
};

// Get single role
const getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch role",
    });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists",
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions: permissions || [],
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create role",
    });
  }
};

// Update role permissions
const updateRolePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update role permissions",
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete role",
    });
  }
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRolePermissions,
  deleteRole,
};
