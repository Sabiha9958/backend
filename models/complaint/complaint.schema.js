// complaint

const mongoose = require("mongoose");
const {
  attachmentSchema,
  commentSchema,
  statusHistorySchema,
} = require("./complaint.subdocs");

const complaintSchema = new mongoose.Schema(
  {
    // basic
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: "text",
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      index: "text",
    },

    // classification
    category: {
      type: String,
      enum: {
        values: [
          "technical",
          "billing",
          "service",
          "product",
          "harassment",
          "safety",
          "other",
        ],
        message: "{VALUE} is not a valid category",
      },
      default: "other",
      required: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: "General",
      maxlength: [100, "Department name cannot exceed 100 characters"],
      index: true,
    },

    // status and priority
    status: {
      type: String,
      enum: {
        values: ["pending", "in_progress", "resolved", "rejected", "closed"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
      required: true,
      index: true,
    },

    // notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    // contact
    contactInfo: {
      name: {
        type: String,
        required: [true, "Contact name is required"],
        trim: true,
        minlength: [2, "Contact name must be at least 2 characters"],
        maxlength: [100, "Contact name cannot exceed 100 characters"],
      },
      email: {
        type: String,
        required: [true, "Contact email is required"],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit phone number"],
      },
    },

    // attachments
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: "Cannot have more than 10 attachments per complaint",
      },
    },

    // comments
    comments: {
      type: [commentSchema],
      default: [],
    },

    // assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedAt: Date,

    // status history
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // resolution
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution note cannot exceed 1000 characters"],
    },

    // rejection
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Rejection reason cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// complaint
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });

module.exports = complaintSchema;
