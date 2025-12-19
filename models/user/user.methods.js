// user

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

function attachUserMethods(schema) {
  // hash password
  schema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  // compare password
  schema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  };

  // changed after token
  schema.methods.changedPasswordAfter = function (jwtIat) {
    if (!this.passwordChangedAt) return false;
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtIat < changedTimestamp;
  };

  // login attempts
  schema.methods.incrementLoginAttempts = async function () {
    const lockTimeMinutes = 15;
    if (this.lockUntil && this.lockUntil < Date.now()) {
      this.loginAttempts = 1;
      this.lockUntil = undefined;
    } else {
      this.loginAttempts += 1;
      if (this.loginAttempts >= 5 && !this.lockUntil) {
        this.lockUntil = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
      }
    }
    await this.save({ validateBeforeSave: false });
  };

  schema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save({ validateBeforeSave: false });
  };

  // reset password token
  schema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
  };
}

module.exports = attachUserMethods;
