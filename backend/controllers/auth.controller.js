const { PrismaClient } = require("@prisma/client");

const { sendEmail } = require("../services/email.service");
const { sendOtpToPhoneNo } = require("../services/twilio.service");
const { generateOTP } = require("../utils/otpGenerator");
const { response } = require("../utils/responseHandler");
const { generateToken } = require("../utils/tokenGenerator");
const { verifyOtpForPhoneNo } = require("../services/twilio.service");
const { uploadFileToCloudinary } = require("../config/cloudinary.config");
const prisma = new PrismaClient();

const sendOtp = async (req, res) => {
  const { phone, phoneSuffix, email } = req.body;
  const otp = generateOTP();
  const expiry = Date.now() + 5 * 60 * 1000;

  try {
    if (email) {
      // check if user exists
      let user = await prisma.user.findUnique({
        where: { email },
      });

      // if user exists, update otp and expiry
      // if not, create new user
      await sendEmail(email, otp); // send otp to email
      if (user) {
        user = await prisma.user.update({
          where: { email },
          data: {
            emailOtp: otp,
            emailOtpExpiry: new Date(expiry),
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            emailOtp: otp,
            emailOtpExpiry: new Date(expiry),
          },
        });
      }
      return response(res, 200, "OTP sent to email", { userId: user.id, otp });
    }

    // ---------------- PHONE OTP ----------------
    if (!phone || !phoneSuffix) {
      return response(res, 400, "Phone and phoneSuffix are required");
    }

    const fullPhone = `${phoneSuffix}${phone}`;

    let user = await prisma.user.findUnique({
      where: { phone: fullPhone },
    });

    await sendOtpToPhoneNo(fullPhone); // Twilio service handles sending

    if (user) {
      user = await prisma.user.update({
        where: { phone: fullPhone },
        data: { otp, otpExpiry: new Date(expiry) },
      });
    } else {
      user = await prisma.user.create({
        data: {
          phone: fullPhone,
          otp,
          otpExpiry: new Date(expiry),
        },
      });
    }

    return response(res, 200, "OTP sent to phone", { userId: user.id });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// ---------------- VERIFY OTP ----------------
const verifyOtp = async (req, res) => {
  const { otp, phone, phoneSuffix, email } = req.body;
  try {
    let user;

    // ---------------- EMAIL VERIFICATION ----------------
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return response(res, 404, "User not found");
      if (user.emailOtp !== otp) return response(res, 400, "Invalid OTP");
      if (user.emailOtpExpiry < new Date()) return response(res, 400, "OTP expired");

      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, emailOtp: null, emailOtpExpiry: null },
      });

    } else {
      // ---------------- PHONE VERIFICATION ----------------
      if (!phone || !phoneSuffix) {
        return response(res, 400, "Phone and phoneSuffix are required");
      }

      const fullPhone = `+${phoneSuffix}${phone}`;

      user = await prisma.user.findUnique({
        where: { phone: fullPhone },
      });

      if (!user) return response(res, 404, "User not found");

      // Verify OTP via Twilio
      const verification = await verifyOtpForPhoneNo(fullPhone, otp);

      if (verification.status !== "approved") {
        return response(res, 400, "Invalid or expired OTP");
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, otp: null, otpExpiry: null },
      });
    }

    // Generate JWT
    const token = generateToken(user?.id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return response(res, 200, "OTP verified", { token, user });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const updateProfile = async (req, res) => {
  const {username, about, agreed} = req.body;
  const userId = req.user.userId || req.user?.userID;

  try {
    const user = await prisma.user.findUnique({
      where: {id: userId}
    });
    const file = req.file;

    if(!user) {
      return response(res, 404, "User not found");
    }

    if(file) {
      const profilePictureUrl = uploadFileToCloudinary(file);
      console.log(profilePictureUrl);
      user.profilePicture = profilePictureUrl?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    } 
    if(username) user.username = username;
    if(about) user.about = about;
    if(agreed) user.agreed = agreed;

    await prisma.user.update({
      where: {id: userId},
      data: {
        username: user.username,
        about: user.about,
        profilePicture: user.profilePicture,
        agreed: user.agreed
      }
    });
    return response(res, 200, "Profile updated", {user});
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return response(res, 500, "Internal Server Error");
  }
}

const logout = (req, res) => {
  try {
    res.cookie("auth_token", "", { expires: new Date(0) });
    return response(res, 200, "Logged out successfully");
  } catch (error) {
    console.error("Error in logout:", error);
    return response(res, 500, "Internal Server Error");
  }
}

const checkAuthentication = async(req, res) => {
  const userId = req.user.userId || req.user?.userID;
  if(!userId) {
    return response(res, 401, "Unauthorized");
  }
  try {
    const user = await prisma.user.findUnique({
      where: {id: userId}
    });

    if(!user) {
      return response(res, 404, "User not found");
    }

    return response(res, 200, "User is authenticated", {user});
  } catch (error) {
    console.error("Error in checkAuthentication:", error);
    return response(res, 500, "Internal Server Error");
  }
}
module.exports = { sendOtp, verifyOtp, updateProfile, logout, checkAuthentication };
