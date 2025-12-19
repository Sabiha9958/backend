// models

const User = require("./user/user.model");
const Complaint = require("./complaint/complaint.model");
const StatusHistory = require("./complaint/statusHistory.model");

module.exports = {
  User,
  Complaint,
  StatusHistory,
};
