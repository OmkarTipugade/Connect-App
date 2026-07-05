const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const { initializeSocket } = require("./services/socket.service");
const { apiLimiter } = require("./middleware/rateLimit.middleware");
const { corsOptions } = require("./config/cors.config");
require("@dotenvx/dotenvx").config();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(apiLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));

const server = http.createServer(app);
const io = initializeSocket(server);

app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/chat", require("./routes/chat.route"));
app.use("/api/story", require("./routes/status.route"));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ status: "error", message: "Internal server error" });
});

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Connect chat API is running");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
