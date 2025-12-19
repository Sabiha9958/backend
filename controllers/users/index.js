// controllers/users/index.js

module.exports = {
  ...require("./users.me.controller"),
  ...require("./users.avatar.controller"),
  ...require("./users.cover.controller"),
  ...require("./users.admin.controller"),
  ...require("./users.bulk.controller"),
};
