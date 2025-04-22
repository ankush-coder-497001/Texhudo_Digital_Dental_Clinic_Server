const nodemailer = require('nodemailer');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_COMPANY,
    pass: process.env.GMAIL_PASSWORD
  },
  // Add timeout and pooling options for better reliability
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendEmailWithRetry = async (mailOptions, retries = 0) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return info;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`Retry attempt ${retries + 1} for email to ${mailOptions.to}`);
      await sleep(RETRY_DELAY * (retries + 1)); // Exponential backoff
      return sendEmailWithRetry(mailOptions, retries + 1);
    }
    throw new Error(`Failed to send email after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};

const sendEmail = async (to, subject, text, html) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error('Missing required email parameters');
    }

    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject,
      text,
      html
    };

    return await sendEmailWithRetry(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const SendOTP = async (to, otp) => {
  try {
    if (!to || !otp) {
      throw new Error('Email and OTP are required');
    }

    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject: 'OTP Verification',
      text: `Your One Time Password (OTP) is: ${otp}. Valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">OTP Verification</h1>
          <p>Your One Time Password (OTP) is:</p>
          <h2 style="color: #4CAF50; padding: 10px; background: #f5f5f5; text-align: center;">${otp}</h2>
          <p>This OTP is valid for 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `
    };

    await sendEmailWithRetry(mailOptions);
    console.log('OTP sent to:', to);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

const welcomeMessege = async (to) => {
  try {
    if (!to) {
      throw new Error('Email is required');
    }

    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject: 'Welcome to Smart Clinic',
      text: 'Welcome to Smart Clinic! Thank you for joining us.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Smart Clinic!</h1>
          <p>Thank you for joining our platform. We're excited to have you with us!</p>
          <p>With Smart Clinic, you can:</p>
          <ul>
            <li>Book appointments with top doctors</li>
            <li>Manage your medical records</li>
            <li>Get online consultations</li>
            <li>Track your treatments</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `
    };

    await sendEmailWithRetry(mailOptions);
    console.log('Welcome email sent to:', to);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

const ForgotPasswordSuccessMessage = async (to) => {
  try {
    if (!to) {
      throw new Error('Email is required');
    }

    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject: 'Password Reset Successful',
      text: 'Your password has been reset successfully!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Successful</h1>
          <p>Your password has been reset successfully.</p>
          <p>If you did not request this change, please contact our support team immediately.</p>
          <p style="color: #666; font-size: 12px;">For security reasons, we recommend changing your password periodically.</p>
        </div>
      `
    };

    await sendEmailWithRetry(mailOptions);
    console.log('Password reset successful email sent to:', to);
  } catch (error) {
    console.error('Error sending password reset successful email:', error);
    throw error;
  }
};

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

module.exports = { sendEmail, SendOTP, welcomeMessege, ForgotPasswordSuccessMessage };