const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: process.env.NODE_ENV === "production" ? 50 : 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== "production",
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    // Single clean log
    console.log(
      `✅ Database: ${conn.connection.name} @ ${conn.connection.host}`
    );

    // Error handling only
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

    return conn;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
