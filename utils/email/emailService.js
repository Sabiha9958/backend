// src/utils/email/emailService.js
const createTransporter = require("./transporter");
const passwordResetTemplate = require("./templates/passwordReset");
const resetSuccessTemplate = require("./templates/resetSuccess");

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `ComplaintMS <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Request - ComplaintMS",
    html: passwordResetTemplate(user, resetUrl),
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (user) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `ComplaintMS <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Successful - ComplaintMS",
    html: resetSuccessTemplate(user),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
};
