// src/utils/email/transporter.js
const nodemailer = require("nodemailer");

// Create nodemailer transporter based on environment
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

module.exports = createTransporter;
