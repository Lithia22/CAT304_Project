const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(email, resetToken) {
  // Create a transporter using SMTP
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: '', // insert your host email 
      pass: '' // insert your host password
    }
  });

  // Format the reset token with spaces between digits for better readability
  const formattedToken = resetToken.split('').join(' ');

  const mailOptions = {
    from: '', // insert your host email 
    to: email,
    subject: 'Password Reset Code',
    text: `
Password Reset Code
You have requested to reset your password.
Your 4-digit reset code is: ${resetToken}
If you did not request a password reset, please ignore this email.
This code will expire in 1 minute.
`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7; border-radius: 10px;">
  <h2 style="color: #4A90E2; margin-bottom: 20px;">Password Reset Code</h2>
  <p style="color: #333; font-size: 16px;">You have requested to reset your password.</p>
  <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
    <p style="margin: 0; color: #333; font-size: 14px;">Your 4-digit reset code is:</p>
    <h1 style="color: #4A90E2; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">${formattedToken}</h1>
  </div>
  <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
  <p style="color: #666; font-size: 14px;">This code will expire in 1 minute.</p>
</div>
`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

module.exports = {
  sendPasswordResetEmail
};