import dotenv from 'dotenv';
import { sendWelcomeEmail, sendPasswordResetEmail, sendNotificationEmail } from './email.js';

dotenv.config();

// Print environment variables for debugging (without sensitive values)
console.log('Environment variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER ? '✓ Set' : '✗ Not set');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✓ Set' : '✗ Not set');
console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
console.log('NODE_ENV:', process.env.NODE_ENV);

/**
 * Test function to demonstrate email sending
 */
const testEmailFunctionality = async () => {
  try {
    // Use a real email address for testing
    const testEmail = process.env.SENDER_EMAIL || 'test@example.com';
    
    // Test sending a welcome email
    console.log(`Testing welcome email to ${testEmail}...`);
    await sendWelcomeEmail(testEmail, 'John Doe');
    console.log('Welcome email test completed.');

    // Test sending a password reset email
    console.log(`Testing password reset email to ${testEmail}...`);
    const resetUrl = 'https://hayagsolar.com/reset-password?token=sampletoken123';
    await sendPasswordResetEmail(testEmail, 'sampletoken123', resetUrl);
    console.log('Password reset email test completed.');

    // Test sending a notification email
    console.log(`Testing notification email to ${testEmail}...`);
    await sendNotificationEmail(
      testEmail,
      'System Maintenance Notice',
      'Our system will be undergoing maintenance on Saturday from 2 AM to 4 AM. During this time, the service might be temporarily unavailable.'
    );
    console.log('Notification email test completed.');

    console.log('All email tests completed successfully!');
  } catch (error) {
    console.error('Email test failed:', error);
    
    // Print more detailed error information
    if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. This could be due to:');
      console.error('1. Incorrect SMTP host or port');
      console.error('2. Firewall blocking the connection');
      console.error('3. SMTP server is down or not accepting connections');
    } else if (error.code === 'EAUTH') {
      console.error('\nAuthentication failed. This could be due to:');
      console.error('1. Incorrect username or password');
      console.error('2. Account restrictions or security settings');
    } else if (error.code === 'ESOCKET') {
      console.error('\nSocket error. This could be due to:');
      console.error('1. Network connectivity issues');
      console.error('2. Incorrect port or secure settings');
    } else if (error.code === 'EDNS') {
      console.error('\nDNS lookup failed. This could be due to:');
      console.error('1. Incorrect SMTP host name');
      console.error('2. DNS resolution issues');
      console.error('3. Network connectivity problems');
    }
    
    console.error('\nPlease check your .env file and ensure all SMTP settings are correct.');
  }
};

// Run the test function
testEmailFunctionality(); 