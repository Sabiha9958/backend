// upload.middleware.js

const {
  multer,
  fs,
  uploadDirs,
  profilePictureStorage,
  coverImageStorage,
  complaintStorage,
  imageFileFilter,
  complaintFileFilter,
} = require("./upload.config");
const path = require("path");

// Generic upload (profilePicture / coverImage / attachments)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let destDir = uploadDirs.profilePictures;

      if (file.fieldname === "coverImage") {
        destDir = uploadDirs.coverImages;
      } else if (file.fieldname === "attachments") {
        destDir = uploadDirs.complaints;
      }

      cb(null, destDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const userId = req.user?.id || req.user?._id || "anonymous";
      const timestamp = Date.now();
      const random = require("crypto").randomBytes(6).toString("hex");

      let prefix = "file";
      if (file.fieldname === "profilePicture") prefix = "profile";
      else if (file.fieldname === "coverImage") prefix = "cover";
      else if (file.fieldname === "attachments") prefix = "complaint";

      const uniqueName = `${prefix}-${userId}-${timestamp}-${random}${ext}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "attachments") {
      complaintFileFilter(req, file, cb);
    } else {
      imageFileFilter(req, file, cb);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Specific helpers
const uploadAvatar = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("avatar");

const uploadCover = multer({
  storage: coverImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("cover");

const uploadComplaintAttachments = multer({
  storage: complaintStorage,
  fileFilter: complaintFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 10,
  },
}).array("attachments", 10);

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size too large. Maximum allowed size is 10MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum 10 files allowed.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = `Unexpected file field: ${err.field}`;
        break;
      case "LIMIT_PART_COUNT":
        message = "Too many parts in the form.";
        break;
      default:
        message = err.message;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      code: err.code,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
      code: "UPLOAD_ERROR",
    });
  }

  next();
};

// Cleanup files on failed responses
const cleanupUploadedFiles = (req, res, next) => {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const cleanup = () => {
    if (res.statusCode >= 400) {
      // Single file
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up failed upload: ${req.file.filename}`);
        } catch (error) {
          console.error("Error cleaning up file:", error);
        }
      }

      // Multiple files
      if (Array.isArray(req.files) && req.files.length > 0) {
        req.files.forEach((file) => {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`Cleaned up failed upload: ${file.filename}`);
            } catch (error) {
              console.error("Error cleaning up file:", error);
            }
          }
        });
      }
    }
  };

  res.json = function patchedJson(...args) {
    cleanup();
    return originalJson(...args);
  };

  res.send = function patchedSend(...args) {
    cleanup();
    return originalSend(...args);
  };

  next();
};

module.exports = {
  upload,
  uploadAvatar,
  uploadCover,
  uploadComplaintAttachments,
  handleMulterError,
  cleanupUploadedFiles,
};
