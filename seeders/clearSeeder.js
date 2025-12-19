// seeders/clearSeeder.js
// Removes all data from the database collections

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logging/logger");
const connectDB = require("../config/db");

dotenv.config();

// Import models
const User = require("../models/user/user.model");
const Complaint = require("../models/complaint/complaint.model");
const StatusHistory = require("../models/complaint/statusHistory.model");

// Clear all seed data from database
const clearData = async () => {
  await connectDB();
  try {
    const [userResult, complaintResult, statusResult] = await Promise.all([
      User.deleteMany(),
      Complaint.deleteMany(),
      StatusHistory.deleteMany(),
    ]);

    logger.warn(
      `⚠️  Seed data cleared successfully:\n` +
        `   - Users removed: ${userResult.deletedCount}\n` +
        `   - Complaints removed: ${complaintResult.deletedCount}\n` +
        `   - StatusHistory removed: ${statusResult.deletedCount}`
    );
  } catch (error) {
    logger.error("❌ Error clearing seed data:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
  }
};

// CLI runner
const run = async () => {
  const arg = process.argv[2];
  switch (arg) {
    case "-d":
      await clearData();
      break;
    default:
      logger.info("Usage: node seeders/clearSeeder.js -d");
      process.exit(0);
  }
};

// Execute if run directly
if (require.main === module) {
  run();
}

module.exports = { clearData };
