// controllers/index.js

const authController = require("./auth");
const userController = require("./users");
const complaintController = require("./complaints");
const reportController = require("./reports");

module.exports = {
  authController,
  userController,
  complaintController,
  reportController,
};
