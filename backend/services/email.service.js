const nodemailer = require("nodemailer");
require("@dotenvx/dotenvx").config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error setting up email transporter:", error);
  } else {
    console.log("Email transporter is ready to send messages");
  }
});

const sendEmail = async (email, otp) => {
  // Create the email content with the OTP in HTML format and some styling
  const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4CAF50;">Connect App - OTP Verification</h2>
            <p>Dear User,</p>
            <p>Your One-Time Password (OTP) for verification is:</p>
            <h1 style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
            <p>This OTP is valid for the next 5 minutes. Please do not share this OTP with anyone.</p>
            <br/>
            <p>Best regards,<br/>Connect App Team</p>
        </div>
    `;
  const mailOptions = {
    from: emailUser,
    to: email,
    subject: "Your Connect App Verification OTP",
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
