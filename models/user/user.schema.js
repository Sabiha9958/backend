const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
    },

    // Auth
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    googleId: { type: String, default: null },
    refreshToken: { type: String, select: false },

    // Media
    profilePicture: { type: String, default: null },

    // Profile fields
    title: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 100 },
    location: { type: String, trim: true, maxlength: 100 },
    bio: { type: String, trim: true, maxlength: 1000 },

    // NEW: Preset cover selection (matches your COVER_IMAGES ids)
    coverId: {
      type: Number,
      default: 1,
      min: 1,
      max: 50,
    },

    // Role
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
      index: true,
    },

    // Status
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },

    // Security / verification
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpire: { type: Date, default: null },
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },

    // Audit
    lastLogin: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    roleChangedAt: { type: Date, default: null },
    roleChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    roleChangeReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = userSchema;
