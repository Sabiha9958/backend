// middleware/index.js

// auth
const { protect, optionalAuth } = require("./auth/auth.middleware");
const { authorize, adminOnly } = require("./auth/roles.middleware");

// rate limit
const {
  createLimiter,
  skipForAdmin,
  skipForDevelopment,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  sensitiveLimiter,
} = require("./rate/rateLimiter.middleware");

// upload
const {
  upload,
  uploadAvatar,
  uploadCover,
  uploadComplaintAttachments,
  handleMulterError,
  cleanupUploadedFiles,
} = require("./upload/upload.middleware");

// validators (raw)
const authValidators = require("./validators/auth.validator");
const userValidators = require("./validators/users.validator");
const complaintValidators = require("./validators/complaints.validator");
const { validate } = require("./validators/validate.middleware");

// error handlers
const { notFound, errorHandler } = require("./validators/errorHandler");

// Ready-to-use auth validators
const registerValidator = validate(authValidators.validateRegister);
const loginValidator = validate(authValidators.validateLogin);
const changePasswordValidator = validate(authValidators.validateChangePassword);
const forgotPasswordValidator = validate(authValidators.validateForgotPassword);
const resetPasswordValidator = validate(authValidators.validateResetPassword);

// Ready-to-use user validators
const updateProfileValidator = validate(userValidators.validateUpdateProfile);
const getUsersQueryValidator = validate(userValidators.validateGetUsersQuery);
const updateUserValidator = validate(userValidators.validateUpdateUser);
const updateUserRoleValidator = validate(userValidators.validateUpdateUserRole);
const deleteUserValidator = validate(userValidators.validateDeleteUser);
const bulkDeleteUsersValidator = validate(
  userValidators.validateBulkDeleteUsers
);

// Ready-to-use complaint validators (to match your routes)
const complaintCreateValidator = validate(
  complaintValidators.validateCreateComplaint
);
const paginationValidator = validate(
  complaintValidators.validateGetComplaintsQuery
);
const complaintUpdateValidator = validate(
  complaintValidators.validateUpdateComplaint
);
const complaintStatusValidator = validate(
  complaintValidators.validateUpdateComplaintStatus
);
const commentValidator = validate(complaintValidators.validateAddComment);

module.exports = {
  // auth
  protect,
  optionalAuth,
  authorize,
  adminOnly,

  // rate limit
  createLimiter,
  skipForAdmin,
  skipForDevelopment,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  sensitiveLimiter,

  // upload
  upload,
  uploadAvatar,
  uploadCover,
  uploadComplaintAttachments,
  handleMulterError,
  cleanupUploadedFiles,

  // validators (raw)
  authValidators,
  userValidators,
  complaintValidators,
  validate,

  // validators (ready-to-use)
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  getUsersQueryValidator,
  updateUserValidator,
  updateUserRoleValidator,
  deleteUserValidator,
  bulkDeleteUsersValidator,
  complaintCreateValidator,
  paginationValidator,
  complaintUpdateValidator,
  complaintStatusValidator,
  commentValidator,

  // error handlers
  notFound,
  errorHandler,
};
