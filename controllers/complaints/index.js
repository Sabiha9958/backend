// controllers/complaints/index.js

module.exports = {
  ...require("./complaints.create.controller"),
  ...require("./complaints.query.controller"),
  ...require("./complaints.update.controller"),
  ...require("./complaints.comments.controller"),
  ...require("./complaints.attachments.controller"),
};
