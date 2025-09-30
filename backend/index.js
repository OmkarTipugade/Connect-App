const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const { PrismaClient } = require("@prisma/client");
const { initializeSocket } = require("./services/socket.service"); 
require("@dotenvx/dotenvx").config();

const app = express();
const prisma = new PrismaClient();
const corsOptions = {
  origin: process.env.FRONTED_URL,
  credentials: true,
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//create server
const server = http.createServer(app);
const io = initializeSocket(server)

// apply socket middleware to express
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
})
//routes
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/chat", require("./routes/chat.route"));
app.use('/api/story',require('./routes/status.route'));

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
