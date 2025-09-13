const express = require("express");
const { sendOtp, verifyOtp, updateProfile } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { multerMiddleware } = require("../config/cloudinary.config");
const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// protected route 
router.put('/update-profile', authMiddleware, multerMiddleware, updateProfile);

module.exports = router;