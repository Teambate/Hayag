import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using SMTP configuration from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify transporter connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Send an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email content
 * @param {string} options.html - HTML email content (optional)
 * @returns {Promise} - Resolves with success or error response
 */
export const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    // Verify connection before sending
    await verifyConnection();
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to "${options.to}" successfully`);
    return { 
      success: true, 
      email: options.to, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.log(`Failed to send email to "${options.to}": ${error.message}`);
    return { 
      success: false, 
      email: options.to, 
      error: error.message 
    };
  }
};

/**
 * Send a welcome email to a new user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @returns {Promise} - Resolves with success or error response
 */
export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Hayag Solar!';
  const text = `Hello ${name},\n\nWelcome to Hayag Solar! We're excited to have you on board.\n\nBest regards,\nThe Hayag Solar Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a9d8f;">Welcome to Hayag Solar!</h2>
      <p>Hello ${name},</p>
      <p>We're excited to have you on board. Thank you for joining our platform.</p>
      <p>With Hayag Solar, you can:</p>
      <ul>
        <li>Monitor your solar energy production</li>
        <li>Track your energy consumption</li>
        <li>Optimize your energy usage</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Hayag Solar Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send a password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - URL for password reset
 * @returns {Promise} - Resolves with success or error response
 */
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const subject = 'Password Reset Request';
  const text = `You requested a password reset. Please use the following link to reset your password: ${resetUrl}\n\nIf you didn't request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a9d8f;">Password Reset Request</h2>
      <p>You requested a password reset. Please use the following link to reset your password:</p>
      <p><a href="${resetUrl}" style="display: inline-block; background-color: #2a9d8f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Hayag Solar Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send a notification email
 * @param {string} email - User's email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise} - Resolves with success or error response
 */
export const sendNotificationEmail = async (email, subject, message) => {
  const text = message;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2a9d8f;">${subject}</h2>
      <p>${message}</p>
      <p>Best regards,<br>The Hayag Solar Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}; 