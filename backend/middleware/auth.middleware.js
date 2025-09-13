const jwt = require('jsonwebtoken');
const { response } = require('../utils/responseHandler');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const auth_token = req.cookies?.auth_token

    if(!auth_token) return res.status(401).json({message: "Authorization token missing, access denied"});

    try {
        const decoded = jwt.verify(auth_token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        return response(res, 401, "Invalid or expired token");
    }
}

module.exports = authMiddleware;