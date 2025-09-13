const twilio = require('twilio');
require('dotenv').config();

const accSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accSid, authToken);

// Send OTP
const sendOtpToPhoneNo = async (phone) => {
  try {
    if (!phone) throw new Error("Phone number is required");

    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phone, channel: "sms" });

    console.log("OTP sent to phone:", verification);
    return verification;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

// Verify OTP
const verifyOtpForPhoneNo = async (phone, otp) => {
  try {
    if (!phone || !otp) throw new Error("Phone and OTP are required");

    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code: otp });

    console.log("OTP verification result:", verificationCheck);
    return verificationCheck;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw new Error("Failed to verify OTP");
  }
};

module.exports = { sendOtpToPhoneNo, verifyOtpForPhoneNo };