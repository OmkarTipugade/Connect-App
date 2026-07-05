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

  console.warn(
    "FRONTEND_URL is not set. CORS will reject cross-origin requests in production.",
  );
  return false;
};

const frontendOrigin = getFrontendOrigin();

const corsOptions = {
  origin: frontendOrigin,
  credentials: true,
};

const socketCorsOptions = {
  origin: frontendOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

module.exports = { corsOptions, socketCorsOptions, getFrontendOrigin };
