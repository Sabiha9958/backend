const Permission = require("../../models/role/Permission");

// Get all permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch permissions",
    });
  }
};

// Create new permission
const createPermission = async (req, res) => {
  try {
    const { key, name, category } = req.body;

    const existingPermission = await Permission.findOne({ key });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: "Permission with this key already exists",
      });
    }

    const permission = await Permission.create({
      key,
      name,
      category: category || "General",
    });

    res.status(201).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create permission",
    });
  }
};

// Delete permission
const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete permission",
    });
  }
};

module.exports = {
  getPermissions,
  createPermission,
  deletePermission,
};
