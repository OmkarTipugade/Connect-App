const jwt = require("jsonwebtoken");
require("@dotenvx/dotenvx").config();

const generateToken = (userID) => {
  const secret = process.env.JWT_SECRET_KEY;

  return jwt.sign({ userID }, secret, { expiresIn: "1y" });
};

module.exports = { generateToken };
