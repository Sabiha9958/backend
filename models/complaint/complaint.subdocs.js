// complaint

const mongoose = require("mongoose");

// complaint
const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "File URL is required"],
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
    mimetype: {
      type: String,
      required: [true, "File mimetype is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      max: [10 * 1024 * 1024, "File size cannot exceed 10MB"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true }
);

// complaint
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    isStaffComment: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true }
);

// complaint
const statusHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected", "closed"],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected", "closed"],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Status changer is required"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    changedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true }
);

module.exports = {
  attachmentSchema,
  commentSchema,
  statusHistorySchema,
};
