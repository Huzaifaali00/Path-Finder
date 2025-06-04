// pathfinder-backend/utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
    // }
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"Path Finder App" <${process.env.EMAIL_USER}>`, // sender address
    to: options.email,          // list of receivers
    subject: options.subject,   // Subject line
    text: options.message,      // plain text body
    html: options.htmlMessage || `<p>${options.message}</p>`, // html body (optional)
  };

  // 3. Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error; // Re-throw to be caught by the route handler
  }
};

module.exports = sendEmail;