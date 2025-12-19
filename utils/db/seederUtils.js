// src/utils/db/seederUtils.js
const mongoose = require("mongoose");
const logger = require("../logging/logger");

const User = require("../../models/UserModel");
const Complaint = require("../../models/Complaint");
const StatusHistory = require("../../models/StatusHistory");
const connectDB = require("../../config/db");
const users = require("../../seeders/userSeeder");
const complaints = require("../../seeders/complaintSeeder");

// Import sample data
const importData = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany(),
      Complaint.deleteMany(),
      StatusHistory.deleteMany(),
    ]);

    const createdUsers = await User.insertMany(users);
    const assignedUser =
      createdUsers.find((u) => u.role === "user") || createdUsers[0];

    const complaintsWithUser = complaints.map((c) => ({
      ...c,
      user: assignedUser._id,
      contactInfo: {
        name: assignedUser.name,
        email: assignedUser.email,
        phone: assignedUser.phone || "1234567890",
      },
    }));

    await Complaint.insertMany(complaintsWithUser);

    logger.info("✅ Sample data imported successfully");
  } catch (error) {
    logger.error("❌ Error importing data:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
    process.exit(0);
  }
};

// Destroy all data
const destroyData = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "❌ Destruction aborted: Running in production environment!"
      );
      process.exit(1);
    }

    await connectDB();

    await Promise.all([
      User.deleteMany(),
      Complaint.deleteMany(),
      StatusHistory.deleteMany(),
    ]);

    logger.warn("⚠️ All data destroyed successfully");
  } catch (error) {
    logger.error("❌ Error destroying data:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
    process.exit(0);
  }
};

// CLI entry
const run = () => {
  const arg = process.argv[2];
  switch (arg) {
    case "-i":
      importData();
      break;
    case "-d":
      destroyData();
      break;
    default:
      logger.info(
        "Usage: node utils/seederUtils.js -i (import) | -d (destroy)"
      );
      process.exit(0);
  }
};

if (require.main === module) {
  run();
}

module.exports = { importData, destroyData };
