// seeders/masterSeeder.js
// Orchestrates all seeders in proper sequence

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("../utils/logging/logger");
const connectDB = require("../config/db");

dotenv.config();

// Import individual seeders
const {
  importData: importUsers,
  destroyData: destroyUsers,
} = require("./userSeeder");
const {
  importData: importComplaints,
  destroyData: destroyComplaints,
} = require("./complaintSeeder");
const { clearData } = require("./clearSeeder");

// Import all seed data sequentially
const importAllData = async () => {
  try {
    logger.info("🚀 Starting master seeding process...\n");

    // Seed users first (required for complaints)
    logger.info("Step 1/2: Seeding users...");
    await importUsers();

    // Seed complaints (depends on users)
    logger.info("\nStep 2/2: Seeding complaints...");
    await importComplaints();

    logger.info("\n✅ All seed data imported successfully");
  } catch (error) {
    logger.error("❌ Error importing seed data:", error.message);
    process.exit(1);
  }
};

// Destroy all seed data sequentially
const destroyAllData = async () => {
  try {
    logger.info("🗑️  Starting data destruction...\n");

    // Destroy complaints first (depends on users)
    logger.info("Step 1/2: Destroying complaints...");
    await destroyComplaints();

    // Destroy users last
    logger.info("\nStep 2/2: Destroying users...");
    await destroyUsers();

    logger.warn("\n⚠️  All seed data destroyed successfully");
  } catch (error) {
    logger.error("❌ Error destroying seed data:", error.message);
    process.exit(1);
  }
};

// CLI runner
const run = async () => {
  await connectDB();

  const arg = process.argv[2];

  try {
    switch (arg) {
      case "-i":
      case "--import":
        await importAllData();
        break;
      case "-d":
      case "--destroy":
        await destroyAllData();
        break;
      case "-c":
      case "--clear":
        await clearData();
        break;
      default:
        logger.info("📋 Master Seeder Usage:");
        logger.info("   node seeders/masterSeeder.js -i    Import all data");
        logger.info("   node seeders/masterSeeder.js -d    Destroy all data");
        logger.info(
          "   node seeders/masterSeeder.js -c    Clear all collections"
        );
        process.exit(0);
    }
  } catch (err) {
    logger.error("❌ Master seeder failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 MongoDB connection closed");
  }
};

// Execute if run directly
if (require.main === module) {
  run();
}

module.exports = { importAllData, destroyAllData, clearData };
