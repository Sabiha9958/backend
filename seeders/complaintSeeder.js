// seeders/complaintSeeder.js
// Professional complaint seeder with realistic data and actual file generation

const { faker } = require("@faker-js/faker");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logging/logger");
const Complaint = require("../models/complaint/complaint.model");
const User = require("../models/user/user.model");

// =============================================================================
// CONFIGURATION
// =============================================================================

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "public",
  "uploads",
  "complaints"
);
const CATEGORIES = [
  "technical",
  "billing",
  "service",
  "product",
  "harassment",
  "safety",
  "other",
];

// Read CLI arguments
const getArgInt = (key, fallback) => {
  const raw = process.argv.find((a) => a.startsWith(`--${key}=`));
  const n = raw
    ? Number(raw.split("=")[1])
    : Number(process.env[key.toUpperCase()]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// =============================================================================
// COMPLAINT TEMPLATES BY CATEGORY
// =============================================================================

const complaintTemplates = {
  technical: [
    {
      title: "Network connectivity issues in {location}",
      priority: "high",
      departments: ["IT", "Facilities"],
    },
    {
      title: "Computer system not booting properly",
      priority: "medium",
      departments: ["IT"],
    },
    {
      title: "Software crashes frequently during use",
      priority: "medium",
      departments: ["IT"],
    },
    {
      title: "VPN connection repeatedly dropping",
      priority: "high",
      departments: ["IT"],
    },
    {
      title: "Printer not responding to print commands",
      priority: "low",
      departments: ["IT"],
    },
    {
      title: "Server downtime affecting operations",
      priority: "high",
      departments: ["IT"],
    },
    {
      title: "Mobile app not syncing data properly",
      priority: "medium",
      departments: ["IT"],
    },
  ],

  billing: [
    {
      title: "Incorrect charges on invoice #{invoice}",
      priority: "high",
      departments: ["Finance", "HR"],
    },
    {
      title: "Payment not reflected after transaction",
      priority: "high",
      departments: ["Finance"],
    },
    {
      title: "Duplicate billing for month of {month}",
      priority: "medium",
      departments: ["Finance"],
    },
    {
      title: "Reimbursement claim pending since {date}",
      priority: "medium",
      departments: ["Finance"],
    },
    {
      title: "Payroll discrepancy for {month}",
      priority: "high",
      departments: ["HR", "Finance"],
    },
    {
      title: "Late fee charged incorrectly",
      priority: "medium",
      departments: ["Finance"],
    },
  ],

  service: [
    {
      title: "Poor customer support response time",
      priority: "medium",
      departments: ["HR", "Facilities"],
    },
    {
      title: "Service quality degraded recently",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "Delayed delivery of requested service",
      priority: "low",
      departments: ["Facilities"],
    },
    {
      title: "Staff unprofessional behavior at {location}",
      priority: "high",
      departments: ["HR"],
    },
    {
      title: "Maintenance request not addressed for weeks",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "Cleaning service not meeting standards",
      priority: "low",
      departments: ["Facilities"],
    },
  ],

  product: [
    {
      title: "Defective equipment received - {product}",
      priority: "high",
      departments: ["IT", "Facilities"],
    },
    {
      title: "Product not matching specifications",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "Missing accessories in product package",
      priority: "low",
      departments: ["Facilities"],
    },
    {
      title: "Product damaged during shipping",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "Warranty claim rejected unfairly",
      priority: "high",
      departments: ["Finance"],
    },
  ],

  harassment: [
    {
      title: "Workplace harassment by colleague",
      priority: "high",
      departments: ["HR"],
    },
    {
      title: "Discriminatory behavior experienced",
      priority: "high",
      departments: ["HR"],
    },
    {
      title: "Bullying incident in {location}",
      priority: "high",
      departments: ["HR", "Security"],
    },
    {
      title: "Inappropriate comments by supervisor",
      priority: "high",
      departments: ["HR"],
    },
    {
      title: "Hostile work environment complaint",
      priority: "high",
      departments: ["HR"],
    },
  ],

  safety: [
    {
      title: "Fire safety equipment not functional",
      priority: "high",
      departments: ["Security", "Facilities"],
    },
    {
      title: "Unsafe working conditions on floor {floor}",
      priority: "high",
      departments: ["Security", "Facilities"],
    },
    {
      title: "Emergency exit blocked in {location}",
      priority: "high",
      departments: ["Security"],
    },
    {
      title: "Electrical hazard near workstation",
      priority: "high",
      departments: ["Facilities", "Security"],
    },
    {
      title: "Slip and fall hazard not addressed",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "Poor lighting creating safety risk",
      priority: "medium",
      departments: ["Facilities"],
    },
  ],

  other: [
    {
      title: "Parking permit renewal request",
      priority: "low",
      departments: ["Security"],
    },
    {
      title: "Lost property not returned from lost & found",
      priority: "low",
      departments: ["Security"],
    },
    {
      title: "Noise disturbance from construction",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "Temperature control issues in {location}",
      priority: "medium",
      departments: ["Facilities"],
    },
    {
      title: "General inquiry about policy",
      priority: "low",
      departments: ["HR"],
    },
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateIndianPhone = () => {
  return `${faker.helpers.arrayElement([
    "9",
    "8",
    "7",
    "6",
  ])}${faker.string.numeric(9)}`;
};

const pickStatus = () => {
  return faker.helpers.weightedArrayElement([
    { value: "pending", weight: 35 },
    { value: "in_progress", weight: 30 },
    { value: "resolved", weight: 20 },
    { value: "closed", weight: 10 },
    { value: "rejected", weight: 5 },
  ]);
};

const buildTitle = (rawTitle) => {
  return rawTitle
    .replace(
      "{location}",
      faker.helpers.arrayElement([
        "Room 301",
        "Building A",
        "Conference Hall",
        "Lab 2",
        "Cafeteria",
        "Parking Lot B",
      ])
    )
    .replace(
      "{floor}",
      faker.helpers.arrayElement(["2nd", "3rd", "4th", "Ground", "5th"])
    )
    .replace(
      "{product}",
      faker.helpers.arrayElement([
        "Laptop",
        "Chair",
        "Desk",
        "Monitor",
        "Keyboard",
      ])
    )
    .replace("{month}", faker.date.month())
    .replace("{date}", faker.date.recent({ days: 30 }).toLocaleDateString())
    .replace("{invoice}", faker.string.numeric(6));
};

// =============================================================================
// FILE GENERATION
// =============================================================================

/**
 * Creates actual dummy files for attachments
 * This ensures files exist and can be viewed
 */
const createDummyFile = async (filename, mimetype) => {
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    if (mimetype.startsWith("image/")) {
      // Create a simple colored rectangle as placeholder image
      // In real scenarios, you might want to use a library like 'sharp' or 'canvas'
      const svgContent = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="${faker.color.rgb()}"/>
          <text x="50%" y="50%" font-size="24" fill="white" text-anchor="middle">
            ${faker.company.catchPhrase()}
          </text>
          <text x="50%" y="55%" font-size="16" fill="white" text-anchor="middle">
            Complaint Evidence - ${faker.date.recent().toLocaleDateString()}
          </text>
        </svg>
      `;
      await fs.writeFile(filePath, svgContent);
    } else if (mimetype === "application/pdf") {
      // Create a simple text file as PDF placeholder
      const pdfContent = `%PDF-1.4
Complaint Document
Generated: ${new Date().toISOString()}
Description: ${faker.lorem.paragraph()}
Contact: ${faker.phone.number()}
Status: ${faker.helpers.arrayElement(["New", "Pending", "Reviewed"])}
`;
      await fs.writeFile(filePath, pdfContent);
    } else {
      // Generic text file
      const textContent = `Complaint Supporting Document
Date: ${new Date().toISOString()}
Reference: ${faker.string.alphanumeric(10).toUpperCase()}
Description: ${faker.lorem.paragraphs(3)}
`;
      await fs.writeFile(filePath, textContent);
    }

    return filePath;
  } catch (error) {
    logger.error(`Failed to create file ${filename}:`, error.message);
    return null;
  }
};

/**
 * Generate realistic file attachments with actual files
 */
const generateAttachments = async (count, complaintDate, category) => {
  const fileTypes = [
    { ext: "png", mime: "image/png", category: "screenshot" },
    { ext: "jpg", mime: "image/jpeg", category: "photo" },
    { ext: "pdf", mime: "application/pdf", category: "document" },
  ];

  const attachments = [];

  for (let i = 0; i < count; i++) {
    const fileType = faker.helpers.arrayElement(fileTypes);
    const ts = Date.now();
    const id = faker.string.alphanumeric(8);
    const originalName = `${category}_${fileType.category}_${faker.number.int({
      min: 100,
      max: 999,
    })}.${fileType.ext}`;
    const filename = `${ts}-${id}-${originalName}`;

    // Create actual file
    await createDummyFile(filename, fileType.mime);

    const relativePath = `/uploads/complaints/${filename}`;

    attachments.push({
      url: relativePath,
      path: relativePath,
      filename,
      originalName,
      mimetype: fileType.mime,
      size: faker.number.int({ min: 50_000, max: 3_000_000 }),
      uploadedAt: faker.date.between({ from: complaintDate, to: new Date() }),
    });
  }

  return attachments;
};

// =============================================================================
// COMPLAINT GENERATION
// =============================================================================

/**
 * Generate a single complaint with realistic data
 */
const generateComplaint = async (user) => {
  // Pick random category
  const category = faker.helpers.arrayElement(CATEGORIES);
  const templates = complaintTemplates[category];
  const template = faker.helpers.arrayElement(templates);

  // Pick department from template's allowed departments
  const department = faker.helpers.arrayElement(template.departments);

  const createdAt = faker.date.recent({ days: 60 });
  const status = pickStatus();

  // More attachments for serious complaints
  const attachmentCount =
    category === "harassment" || category === "safety"
      ? faker.number.int({ min: 2, max: 5 })
      : template.priority === "high"
      ? faker.number.int({ min: 2, max: 4 })
      : faker.number.int({ min: 0, max: 2 });

  const updatedAt =
    status === "pending"
      ? createdAt
      : faker.date.between({ from: createdAt, to: new Date() });

  // Generate attachments with actual files
  const attachments = await generateAttachments(
    attachmentCount,
    createdAt,
    category
  );

  return {
    title: buildTitle(template.title),
    description: faker.lorem.paragraphs({ min: 2, max: 4 }),
    category, // ✅ Added category field
    department,
    status,
    priority: template.priority,
    user: user._id,
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
      probability: status !== "pending" ? 0.6 : 0.1,
    }),
    contactInfo: {
      name: user.name,
      email: user.email,
      phone: generateIndianPhone(),
    },
    attachments,
    createdAt,
    updatedAt,
  };
};

// =============================================================================
// IMPORT & DESTROY FUNCTIONS
// =============================================================================

/**
 * Import complaints into database
 */
const importData = async () => {
  try {
    const complaintCount = getArgInt("complaints", 100);

    // Clear existing complaints
    const deleteResult = await Complaint.deleteMany();
    logger.info(`🗑️  Cleared ${deleteResult.deletedCount} existing complaints`);

    // Clear old attachment files
    try {
      await fs.rm(UPLOAD_DIR, { recursive: true, force: true });
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      logger.info("🗑️  Cleared old attachment files");
    } catch (error) {
      logger.warn("⚠️  Could not clear upload directory:", error.message);
    }

    // Get users
    const users = await User.find({ role: "user" }).select("_id name email");
    if (!users || users.length === 0) {
      logger.warn("⚠️  No users found with role 'user'. Seed users first.");
      logger.info("💡 Run: node seeders/userSeeder.js -i");
      process.exit(0);
    }

    logger.info(`👥 Found ${users.length} users`);
    logger.info(`📝 Generating ${complaintCount} complaints...`);

    // Generate complaints (with actual file creation)
    const complaints = [];
    for (let i = 0; i < complaintCount; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const complaint = await generateComplaint(randomUser);
      complaints.push(complaint);

      // Progress indicator
      if ((i + 1) % 20 === 0 || i + 1 === complaintCount) {
        logger.info(`   Generated ${i + 1}/${complaintCount} complaints...`);
      }
    }

    // Insert into database
    logger.info("💾 Inserting complaints into database...");
    const insertedComplaints = await Complaint.insertMany(complaints);
    logger.info(
      `✅ Successfully seeded ${insertedComplaints.length} complaints`
    );

    // Statistics
    const [statusCounts, deptCounts, categoryCounts] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    logger.info("\n📊 SEEDING STATISTICS");
    logger.info("═".repeat(50));

    logger.info("\n📈 Status Distribution:");
    statusCounts.forEach((stat) =>
      logger.info(`   ${stat._id.padEnd(15)} → ${stat.count}`)
    );

    logger.info("\n🏢 Department Distribution:");
    deptCounts.forEach((stat) =>
      logger.info(`   ${stat._id.padEnd(15)} → ${stat.count}`)
    );

    logger.info("\n🏷️  Category Distribution:");
    categoryCounts.forEach((stat) =>
      logger.info(`   ${stat._id.padEnd(15)} → ${stat.count}`)
    );

    logger.info("\n" + "═".repeat(50));
    logger.info(`📁 Attachment files created in: ${UPLOAD_DIR}`);

    process.exit(0);
  } catch (error) {
    if (error.name === "ValidationError") {
      logger.error("\n❌ Validation Error:");
      Object.keys(error.errors).forEach((key) =>
        logger.error(`   - ${key}: ${error.errors[key].message}`)
      );
    } else {
      logger.error("❌ Error seeding complaints:", error.message);
      if (process.env.NODE_ENV === "development") logger.error(error.stack);
    }
    process.exit(1);
  }
};

/**
 * Destroy all complaints and attachment files
 */
const destroyData = async () => {
  try {
    const result = await Complaint.deleteMany();
    if (result.deletedCount > 0) {
      logger.warn(`⚠️  Deleted ${result.deletedCount} complaint(s)`);
    } else {
      logger.info("ℹ️  No complaints found to delete");
    }

    // Clean up attachment files
    try {
      await fs.rm(UPLOAD_DIR, { recursive: true, force: true });
      logger.info("🗑️  Deleted all attachment files");
    } catch (error) {
      logger.warn("⚠️  Could not delete attachment files:", error.message);
    }

    process.exit(0);
  } catch (error) {
    logger.error("❌ Error destroying complaints:", error.message);
    process.exit(1);
  }
};

// =============================================================================
// CLI RUNNER
// =============================================================================

if (require.main === module) {
  const arg = process.argv[2];

  if (!arg) {
    logger.info("\n📋 COMPLAINT SEEDER");
    logger.info("═".repeat(50));
    logger.info("\n📥 Import complaints:");
    logger.info("   node seeders/complaintSeeder.js -i --complaints=100");
    logger.info("\n🗑️  Destroy complaints:");
    logger.info("   node seeders/complaintSeeder.js -d");
    logger.info("\n💡 Categories: technical, billing, service, product,");
    logger.info("               harassment, safety, other");
    logger.info("═".repeat(50) + "\n");
    process.exit(0);
  }

  switch (arg) {
    case "-i":
    case "--import":
      importData();
      break;
    case "-d":
    case "--destroy":
      destroyData();
      break;
    default:
      logger.warn(`⚠️  Unknown argument: ${arg}`);
      logger.info("Use -i (import) or -d (destroy)");
      process.exit(1);
  }
}

module.exports = { importData, destroyData, generateComplaint };
