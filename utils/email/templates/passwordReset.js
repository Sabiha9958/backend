// src/utils/email/templates/passwordReset.js

// Build password reset email HTML
const passwordResetTemplate = (user, resetUrl) => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 30px; text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb; padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block; padding: 15px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; text-decoration: none; border-radius: 8px;
          font-weight: bold; margin: 20px 0;
        }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>You requested to reset your password for your ComplaintMS account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p><strong>⏰ This link will expire in 10 minutes.</strong></p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            <strong>⚠️ Didn't request this?</strong><br>
            If you didn't request a password reset, please ignore this email or contact support.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ComplaintMS. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
  </html>
`;

module.exports = passwordResetTemplate;
