const DEFAULT_DEV_ORIGIN = "http://localhost:5173";

/**
 * Resolve allowed frontend origin for CORS / Socket.io.
 * Uses FRONTEND_URL only — no typo fallbacks.
 */
const getFrontendOrigin = () => {
  const origin = process.env.FRONTEND_URL;

  if (origin) return origin;

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_ORIGIN;
  }

  throw new Error(
    "FRONTEND_URL must be set in production. Refusing to start with open or disabled CORS.",
  );
};

const frontendOrigin = getFrontendOrigin();

const corsOptions = {
  origin(origin, callback) {
    // Same-origin or non-browser requests (no Origin header)
    if (!origin || origin === frontendOrigin) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const socketCorsOptions = {
  origin: frontendOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

module.exports = { corsOptions, socketCorsOptions, getFrontendOrigin };
