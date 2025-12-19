// src/utils/email/templates/resetSuccess.js

// Build password reset success email HTML
const resetSuccessTemplate = (user) => `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ Password Reset Successful</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          © ${new Date().getFullYear()} ComplaintMS
        </p>
      </div>
    </body>
  </html>
`;

module.exports = resetSuccessTemplate;
