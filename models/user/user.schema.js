// user

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // basic
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

    // auth
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    googleId: { type: String },
    profilePicture: { type: String, default: null },

    // profile
    title: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 100 },
    location: { type: String, trim: true, maxlength: 100 },
    bio: { type: String, trim: true, maxlength: 1000 },

    // role
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
      index: true,
    },

    // status
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },

    // security
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    isEmailVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: { type: String, select: false },

    // audit
    lastLogin: Date,
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    roleChangedAt: Date,
    roleChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    roleChangeReason: { type: String, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
  }
);

module.exports = userSchema;
