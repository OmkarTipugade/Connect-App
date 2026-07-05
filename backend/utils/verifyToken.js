const jwt = require("jsonwebtoken");
const { getTokenUserId } = require("./authUser");
require("@dotenvx/dotenvx").config();

const verifyToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch {
    return null;
  }
};

/** Verify token and return the authenticated user id, or null. */
const verifyTokenUserId = (token) => getTokenUserId(verifyToken(token));

module.exports = { verifyToken, verifyTokenUserId, getTokenUserId };
