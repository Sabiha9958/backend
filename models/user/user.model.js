// user

const mongoose = require("mongoose");
const userSchema = require("./user.schema");
const attachUserMethods = require("./user.methods");

attachUserMethods(userSchema);

const User = mongoose.model("User", userSchema);

module.exports = User;
