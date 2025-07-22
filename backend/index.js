require('dotenv').config();
console.log('Loaded ENV:', {
  PORT: process.env.PORT,
  AMI_USERNAME: process.env.AMI_USERNAME,
  AMI_PASSWORD: process.env.AMI_PASSWORD,
  AMI_HOST: process.env.AMI_HOST,
  AMI_PORT: process.env.AMI_PORT
});
const http = require("http");
const { Server } = require("socket.io");
const { ami, setupAmi } = require("./config/amiConfig");
const app = require("./app");
const PORT = process.env.PORT ?? 4000;
const USERNAME = process.env.AMI_USERNAME ?? "admin";
const PASSWORD = process.env.AMI_PASSWORD ?? "admin@123";

// Create HTTP server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE"],
  },
});

// Connect to AMI globally at startup
(async () => {
  try {
    await ami.connect(USERNAME, PASSWORD, {
      host: process.env.AMI_HOST || "10.42.0.1",
      port: process.env.AMI_PORT || 5038,
    });
    ami.setMaxListeners(100);
    global.amiReady = true;
    console.log("[AMI] Connected globally at startup");
  } catch (err) {
    console.error("[AMI] Connection error at startup:", err);
  }
})();

// Socket.IO connection
io.on("connection", async (socket) => {
  console.log("Client connected");
  // Initialize AMI for this socket connection
  setupAmi(io, socket);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start server and initialize database
server.listen(PORT, async () => {
  // await createDatabase();
  // await syncDB();
  console.log(`Server started on PORT: ${PORT}`);
});

module.exports = { io, ami };
