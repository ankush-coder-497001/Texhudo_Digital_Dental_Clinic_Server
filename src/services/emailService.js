const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_COMPANY, // Your Gmail address
    pass: process.env.GMAIL_PASSWORD  // Fixed to match .env variable name
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const SendOTP = async (to,otp) => {
  try {
    

  const mailOptions =  {
    from: process.env.GMAIL_COMPANY,
    to,
    subject: 'OTP Verification',
    text: `Your One Time Password (OTP) is: ${otp}`,
    html: `<h1>OTP Verification</h1><p>Your One Time Password (OTP) is: ${otp}</p>`
  }
  await transporter.sendMail(mailOptions);
  console.log('OTP sent to:', to);
} catch (error) {
   console.error('Error sending OTP:', error);
   throw error;
}
}

const welcomeMessege = async (to) =>{
  try {
    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject: 'Welcome to our service',
      text: `Welcome to our service!`,
      html: `<h1>Welcome to our service!</h1>`
    };
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', to);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

const ForgotPasswordSuccessMessage  = async (to) =>{
  try {
    const mailOptions = {
      from: process.env.GMAIL_COMPANY,
      to,
      subject: 'Password Reset Successful',
      text: `Your password has been reset successfully!`,
      html: `<h1>Password Reset Successful</h1><p>Your password has been reset successfully!</p>`
    };
    await transporter.sendMail(mailOptions);
    console.log('Password reset successful email sent to:', to);
  } catch (error) {
    console.error('Error sending password reset successful email:', error);
    throw error;
  }
}

module.exports = { sendEmail , SendOTP,welcomeMessege , ForgotPasswordSuccessMessage };