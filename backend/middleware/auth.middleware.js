const { response } = require("../utils/responseHandler");
const { verifyToken } = require("../utils/verifyToken");
const { getTokenUserId } = require("../utils/authUser");
require("@dotenvx/dotenvx").config();

const authMiddleware = (req, res, next) => {
  const auth_token = req.cookies?.auth_token;

  if (!auth_token)
    return response(res, 401, "Authentication token is missing");

  const decoded = verifyToken(auth_token);
  if (!decoded) return response(res, 401, "Invalid or expired token");

  const userId = getTokenUserId(decoded);
  if (!userId) return response(res, 401, "Invalid or expired token");

  req.user = decoded;
  req.authUserId = userId;
  next();
};

module.exports = authMiddleware;
