const jwt = require("jsonwebtoken");
require("@dotenvx/dotenvx").config();

const verifyToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch {
    return null;
  }
};

module.exports = { verifyToken };
