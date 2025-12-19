// complaints

const { body, param, query } = require("express-validator");

const validateCreateComplaint = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category").optional().trim(),
  body("priority")
    .optional()
    .trim()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("contactInfo").optional(),
];

const validateGetComplaintsQuery = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().trim(),
  query("category").optional().trim(),
  query("priority").optional().trim(),
  query("department").optional().trim(),
  query("search").optional().trim(),
];

const validateComplaintId = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
];

const validateUpdateComplaint = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
  body("title").optional().trim(),
  body("description").optional().trim(),
  body("category").optional().trim(),
  body("priority").optional().trim(),
  body("status").optional().trim(),
  body("notes").optional().trim(),
  body("assignedTo").optional().isMongoId().withMessage("Invalid staff ID"),
];

const validateUpdateComplaintStatus = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
  body("status").trim().notEmpty().withMessage("Status is required"),
  body("note").optional().trim(),
];

const validateDeleteComplaint = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
];

const validateAddComment = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
  body("comment").trim().notEmpty().withMessage("Comment text is required"),
];

const validateGetComments = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
];

const validateDownloadAttachment = [
  param("id").isMongoId().withMessage("Invalid complaint ID"),
  param("attachmentId").isMongoId().withMessage("Invalid attachment ID"),
];

module.exports = {
  validateCreateComplaint,
  validateGetComplaintsQuery,
  validateComplaintId,
  validateUpdateComplaint,
  validateUpdateComplaintStatus,
  validateDeleteComplaint,
  validateAddComment,
  validateGetComments,
  validateDownloadAttachment,
};
