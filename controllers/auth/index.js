// controllers/auth/index.js

module.exports = {
  // registration + login
  ...require("./auth.register.controller"),
  ...require("./auth.login.controller"),

  // tokens and password reset
  ...require("./auth.tokens.controller"),

  // OAuth
  ...require("./auth.google.controller"),

  // session
  ...require("./auth.session.controller"),

  // profile (if you keep some profile stuff in auth)
  ...require("./auth.profile.controller"),

  // admin operations (user management via auth)
  ...require("./auth.admin-users.controller"),
};
