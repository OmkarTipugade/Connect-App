const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: "error", message: "Too many OTP requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { status: "error", message: "Too many requests. Slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpLimiter, apiLimiter };
