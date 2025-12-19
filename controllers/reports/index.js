// controllers/reports/index.js

module.exports = {
  ...require("./reports.complaints.controller"),
  ...require("./reports.users.controller"),
};
