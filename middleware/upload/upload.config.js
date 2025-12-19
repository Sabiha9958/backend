// upload.config.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOAD_BASE = path.join(process.cwd(), "uploads");

const uploadDirs = {
  profilePictures: path.join(UPLOAD_BASE, "profile-pictures"),
  coverImages: path.join(UPLOAD_BASE, "cover-images"),
  complaints: path.join(UPLOAD_BASE, "complaints"),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure directories exist
Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created upload directory: ${dir}`);
  }
});

// Profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.profilePictures);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || req.user?._id || "anonymous";
    const uniqueName = `profile-${userId}-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

// Cover images
const coverImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.coverImages);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || req.user?._id || "anonymous";
    const uniqueName = `cover-${userId}-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

// Complaint attachments
const complaintStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.complaints);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const uniqueName = `complaint-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

// Image-only filter
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
      ),
      false
    );
  }
};

// Complaint attachments filter (images + docs)
const complaintFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DOC, DOCX"
      ),
      false
    );
  }
};

module.exports = {
  multer,
  fs,
  uploadDirs,
  profilePictureStorage,
  coverImageStorage,
  complaintStorage,
  imageFileFilter,
  complaintFileFilter,
  UPLOAD_BASE,
};
