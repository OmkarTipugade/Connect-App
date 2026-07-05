const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60 * 1000,
  path: "/",
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};

const clearAuthCookieOptions = {
  httpOnly: authCookieOptions.httpOnly,
  path: authCookieOptions.path,
  sameSite: authCookieOptions.sameSite,
  secure: authCookieOptions.secure,
};

module.exports = { authCookieOptions, clearAuthCookieOptions };
