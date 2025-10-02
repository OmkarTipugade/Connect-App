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

    user = await prisma.user.findFirst({
      where: { phone: phone, phoneSuffix: phoneSuffix },
    });

    await sendOtpToPhoneNo(fullPhone); // Twilio service handles sending

    user = await prisma.user.upsert({
      where: { phone },
      update: { otp, otpExpiry: new Date(expiry), phoneSuffix },
      create: { phone, phoneSuffix, otp, otpExpiry: new Date(expiry) },
    });

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
      if (user.emailOtpExpiry < new Date())
        return response(res, 400, "OTP expired");

      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, emailOtp: null, emailOtpExpiry: null },
      });
    } else {
      // ---------------- PHONE VERIFICATION ----------------
      if (!phone || !phoneSuffix) {
        return response(res, 400, "Phone and phoneSuffix are required");
      }

      const fullPhone = `${phoneSuffix}${phone}`;

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
  const { username, about, agreed } = req.body;
  const userId = req.user?.userID || req.user.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return response(res, 404, "User not found");

    const data = {};

    if (username) data.username = username;
    if (about) data.about = about;
    if (agreed !== undefined) {
      data.agreed = agreed === "true";
    }

    if (req.file) {
      // Multer uploaded file → upload to Cloudinary
      const profilePictureUrl = await uploadFileToCloudinary(req.file);
      data.profilePicture = profilePictureUrl?.secure_url;
    } else if (req.body.profilePicture) {
      // Avatar URL (or plain URL string)
      data.profilePicture = req.body.profilePicture;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return response(res, 200, "Profile updated", { user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return response(res, 500, "Internal Server Error");
  }
};


const logout = (req, res) => {
  try {
    res.cookie("auth_token", "", { expires: new Date(0) });
    return response(res, 200, "Logged out successfully");
  } catch (error) {
    console.error("Error in logout:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const checkAuthentication = async (req, res) => {
  const userId = req.user?.userID || req.user.userId;
  if (!userId) {
    return response(res, 401, "Unauthorized");
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return response(res, 404, "User not found");
    }

    return response(res, 200, "User is authenticated", { user });
  } catch (error) {
    console.error("Error in checkAuthentication:", error);
    return response(res, 500, "Internal Server Error");
  }
};

const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userId;

  try {
    // 1. Get all users except logged-in user
    const users = await prisma.user.findMany({
      where: {
        id: { not: loggedInUser },
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        lastSeen: true,
        isOnline: true,
        about: true,
        phone: true,
        phoneSuffix: true,
      },
    });

    // 2. Attach conversations (if exists) for each user
    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await prisma.conversation.findFirst({
          where: {
            members: {
              some: { id: loggedInUser },
            },
            AND: {
              members: {
                some: { id: user.id },
              },
            },
          },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                sender: true,
                receiver: true,
              },
            },
          },
        });

        return {
          ...user,
          conversation: conversation
            ? {
              ...conversation,
              lastMessage: conversation.messages[0] || null,
            }
            : null,
        };
      })
    );

    return response(res, 200, "Users fetched successfully", {
      users: usersWithConversation,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return response(res, 500, "Internal Server Error");
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthentication,
  getAllUsers,
};
