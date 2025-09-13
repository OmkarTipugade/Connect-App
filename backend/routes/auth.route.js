const express = require("express");
const {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthentication,
  getAllUsers,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { multerMiddleware } = require("../config/cloudinary.config");
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/logout", authMiddleware, logout);

// protected route
router.put("/update-profile", authMiddleware, multerMiddleware, updateProfile);
router.get("/check-auth", authMiddleware, checkAuthentication);
router.get("/all-users", authMiddleware, getAllUsers);

module.exports = router;
