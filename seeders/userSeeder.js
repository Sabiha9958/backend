// seeders/userSeeder.js
// Seeds user accounts (admin/staff + random users) with profile image urls

const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
const logger = require("../utils/logging/logger");
const User = require("../models/user/user.model");

const DEFAULT_USER_PASSWORD = "Password@123";

// Read --key=value with env fallback
const getArgInt = (key, fallback) => {
  const raw = process.argv.find((a) => a.startsWith(`--${key}=`));
  const n = raw
    ? Number(raw.split("=")[1])
    : Number(process.env[key.toUpperCase()]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Hash password
const hashPassword = async (plainPassword) => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return bcrypt.hash(plainPassword, saltRounds);
};

// Generate an avatar url (external) or a placeholder seed-based image url
const generateProfileImage = () => {
  return faker.image.avatar(); // Returns a random avatar image url [web:92]
};

// Generate a valid 10-digit Indian-style phone number
const generateIndianPhone = () => {
  return `${faker.helpers.arrayElement([
    "9",
    "8",
    "7",
    "6",
  ])}${faker.string.numeric(9)}`;
};

// Build one user object
const buildUser = async ({
  role = "user",
  password = DEFAULT_USER_PASSWORD,
  fixed = {},
} = {}) => {
  const sex = faker.helpers.arrayElement(["male", "female"]);
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName(sex);

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: await hashPassword(password),
    role,
    isEmailVerified:
      faker.helpers.maybe(() => true, { probability: 0.85 }) ?? false,
    phone: generateIndianPhone(),
    profileImage: generateProfileImage(), // Ensure your schema has this field
    createdAt: faker.date.past({ years: 1 }),
    ...fixed,
  };
};

// Generate many users
const generateUsers = async (count, role = "user") => {
  const users = [];
  for (let i = 0; i < count; i++) users.push(await buildUser({ role }));
  return users;
};

// Seed users
const importData = async () => {
  try {
    const userCount = getArgInt("users", 100);

    await User.deleteMany();
    logger.info("🗑️  Cleared existing users");

    const adminUsers = [
      {
        name: "Zikaullah",
        email: "zikaullah@gmail.com",
        password: await hashPassword("Admin@123"),
        role: "admin",
        isEmailVerified: true,
        phone: "9876543210",
        profileImage: generateProfileImage(),
        createdAt: new Date("2024-01-01"),
      },
    ];

    const staffUsers = [
      {
        name: "Kef Khan",
        email: "kefkhan@gmail.com",
        password: await hashPassword("Staff@123"),
        role: "staff",
        isEmailVerified: true,
        phone: "9876543211",
        profileImage: generateProfileImage(),
        createdAt: new Date("2024-01-15"),
      },
      {
        name: "Madhu Kumari",
        email: "madhukumari@gmail.com",
        password: await hashPassword("Staff@123"),
        role: "staff",
        isEmailVerified: true,
        phone: "9876543212",
        profileImage: generateProfileImage(),
        createdAt: new Date("2024-02-01"),
      },
    ];

    const randomUsers = await generateUsers(userCount, "user");

    const allUsers = [...adminUsers, ...staffUsers, ...randomUsers];
    await User.insertMany(allUsers);

    logger.info(`✅ Successfully seeded ${allUsers.length} users:`);
    logger.info(`   - Admins: ${adminUsers.length}`);
    logger.info(`   - Staff: ${staffUsers.length}`);
    logger.info(`   - Users: ${randomUsers.length}`);
    logger.info(`   - Avatars: faker.image.avatar() urls`);
  } catch (error) {
    logger.error("❌ Error seeding users:", error.message);
    process.exit(1);
  }
};

// Destroy users
const destroyData = async () => {
  try {
    const result = await User.deleteMany();
    logger.warn(`⚠️  Deleted ${result.deletedCount} user(s) from database`);
  } catch (error) {
    logger.error("❌ Error destroying users:", error.message);
    process.exit(1);
  }
};

// CLI runner
if (require.main === module) {
  const arg = process.argv[2];

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
      logger.info(
        "Usage: node seeders/userSeeder.js -i|--import -d|--destroy --users=200"
      );
      process.exit(0);
  }
}

module.exports = { importData, destroyData, generateUsers };
