// controllers/auth/auth.profile.controller.js

const { asyncHandler, formatUserResponse } = require("./auth.helpers");
const User = require("../../models/user/user.model");

exports.updateProfilePicture = asyncHandler(async (req, res) => {
  if (!req.user || !req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded or not authenticated",
    });
  }

  const user = await User.findById(req.user._id);

  const profilePicture = `/uploads/profile-pictures/${req.file.filename}`;

  user.profilePicture = profilePicture;
  user.avatarVersion = Date.now();

  await user.save();

  const formatted = formatUserResponse(user);

  return res.status(200).json({
    success: true,
    message: "Profile picture updated",
    data: formatted,
  });
});
