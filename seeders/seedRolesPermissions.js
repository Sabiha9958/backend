// seeders/seedRolesPermissions.js
// Seeds roles and permissions for RBAC system

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logging/logger");
const Role = require("../models/role/Role");
const Permission = require("../models/role/Permission");

dotenv.config();

// Define all permissions
const permissions = [
  // Complaint permissions
  { key: "complaints.read", name: "View complaints", category: "Complaints" },
  {
    key: "complaints.create",
    name: "Create complaints",
    category: "Complaints",
  },
  {
    key: "complaints.update",
    name: "Update complaints",
    category: "Complaints",
  },
  {
    key: "complaints.delete",
    name: "Delete complaints",
    category: "Complaints",
  },
  {
    key: "complaints.assign",
    name: "Assign complaints",
    category: "Complaints",
  },

  // User permissions
  { key: "users.read", name: "View users", category: "Users" },
  { key: "users.create", name: "Create users", category: "Users" },
  { key: "users.update", name: "Update users", category: "Users" },
  { key: "users.delete", name: "Delete users", category: "Users" },

  // Admin permissions
  { key: "roles.manage", name: "Manage roles", category: "Administration" },
  {
    key: "permissions.manage",
    name: "Manage permissions",
    category: "Administration",
  },
  {
    key: "reports.generate",
    name: "Generate reports",
    category: "Administration",
  },
  {
    key: "settings.manage",
    name: "Manage settings",
    category: "Administration",
  },
];

// Define roles with their permissions
const roles = [
  {
    name: "Admin",
    description: "Full system access with all permissions",
    permissions: permissions.map((p) => p.key),
  },
  {
    name: "Staff",
    description: "Handle and manage complaints",
    permissions: [
      "complaints.read",
      "complaints.update",
      "complaints.assign",
      "users.read",
    ],
  },
  {
    name: "User",
    description: "Basic user with limited access",
    permissions: ["complaints.read", "complaints.create"],
  },
];

// Seed roles and permissions
async function seedData() {
  try {
    // Connect to database
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/complaint-system";
    await mongoose.connect(uri);
    logger.info("📡 Connected to MongoDB");

    // Clear existing data
    await Promise.all([Permission.deleteMany({}), Role.deleteMany({})]);
    logger.info("🗑️  Cleared existing roles and permissions");

    // Insert permissions
    const createdPermissions = await Permission.insertMany(permissions);
    logger.info(`✅ Seeded ${createdPermissions.length} permissions`);

    // Group permissions by category for logging
    const categories = [...new Set(permissions.map((p) => p.category))];
    categories.forEach((cat) => {
      const count = permissions.filter((p) => p.category === cat).length;
      logger.info(`   - ${cat}: ${count} permissions`);
    });

    // Insert roles
    const createdRoles = await Role.insertMany(roles);
    logger.info(`✅ Seeded ${createdRoles.length} roles`);

    roles.forEach((role) => {
      logger.info(`   - ${role.name}: ${role.permissions.length} permissions`);
    });

    logger.info("🎉 Roles and permissions seeded successfully!");
  } catch (error) {
    logger.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info("🔌 MongoDB connection closed");
  }
}

// Execute if run directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
