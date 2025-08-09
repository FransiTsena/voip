require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const AmiClient = require("asterisk-ami-client");
const app = require("./app"); // Your Express app
const { setupAmiEventListeners, state, emitAgentStatus } = require('./config/amiConfig');

// Import the setup function and state from our refactored AMI handler

// --- Configuration ---
const PORT = process.env.PORT || 4000;
const AMI_USERNAME = process.env.AMI_USERNAME || "admin";
const AMI_PASSWORD = process.env.AMI_PASSWORD || "admin@123";
const AMI_HOST = process.env.AMI_HOST || "127.0.0.1";
const AMI_PORT = parseInt(process.env.AMI_PORT || 5038, 10);

// --- Server & Socket.IO Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Be more specific in production, e.g., "http://localhost:3000"
    methods: ["GET", "POST"],
  },
});

// --- AMI Connection and Application Logic ---
const ami = new AmiClient();

// Make AMI globally accessible
global.ami = ami;
global.amiReady = false;

// Connect to AMI, then set up all event listeners and socket connections.
ami.connect(AMI_USERNAME, AMI_PASSWORD, { host: AMI_HOST, port: AMI_PORT })
  .then(() => {
    console.log("✅ [AMI] Connected successfully!");
    global.amiReady = true;

    // CRITICAL: Set up the AMI event listeners ONCE after a successful connection.
    setupAmiEventListeners(ami, io);

    // Handle individual client (browser) connections.
    io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // When a new client connects, send them the current state immediately.
      // This ensures their dashboard is populated without waiting for a new event.
      socket.emit("ongoingCalls", Object.values(state.ongoingCalls));
      socket.emit("queueMembers", state.queueMembers);
      
      // Send current enriched agent status if available
      if (Object.keys(state.agentStatus).length > 0) {
        emitAgentStatus(socket); // Send to this specific socket
      }

      // Handle request for current agent list - now uses enriched data
      socket.on("requestAgentList", () => {
        try {
          if (!global.amiReady) {
            socket.emit("agentListError", { error: "AMI not connected" });
            return;
          }

          // Send the enriched agent data immediately from memory
          emitAgentStatus(socket);
          
        } catch (error) {
          socket.emit("agentListError", { error: error.message });
        }
      });

      // Handle events received FROM this specific client.
      socket.on("hangupCall", (linkedId) => {
        if (!linkedId) return;
        
        console.log(`Client ${socket.id} requested hangup for call: ${linkedId}`);
        const call = state.ongoingCalls[linkedId];

        if (call && call.channels) {
          // Hang up every channel associated with the call
          call.channels.forEach(channel => {
            ami.action({ Action: "Hangup", Channel: channel, Cause: "16" });
          });
        } else {
          console.warn(`Hangup request for unknown call ID: ${linkedId}`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

  })
  .catch((err) => {
    console.error("❌ [AMI] Connection failed. The application cannot start.", err);
    // Exit the process if we can't connect to Asterisk, as the app is non-functional.
    process.exit(1);
  });


// --- Start Server ---
server.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});