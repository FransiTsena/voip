require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const AmiClient = require("asterisk-ami-client");
const app = require("./app"); // Your Express app
const { setupAmiEventListeners, state } = require("./config/amiConfig");
const {
  emitAgentStatusOnly,
  state: agentState,
} = require("./controllers/agentControllers/realTimeAgent");

// Import queue statistics scheduler
const { scheduleQueueStatsCalculation } = require("./utils/queueStatsScheduler");

// Import the setup function and state from our refactored AMI handler

// --- Configuration ---
const PORT = process.env.PORT || 4000;
const AMI_USERNAME = process.env.AMI_USERNAME || "admin";
const AMI_PASSWORD = process.env.AMI_PASSWORD || "admin@123";
const AMI_HOST = process.env.AMI_HOST || "127.0.0.1";
const AMI_PORT = parseInt(process.env.AMI_PORT || 5038, 10);

// --- Server & Socket.IO Setup ---
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Be more specific in production, e.g., "https://localhost:3000"
//     methods: ["GET", "POST", "PATCH"],
//   },
// });
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', "https://172.20.47.53", "https://172.20.47.53:5000"],
    methods: ["GET", "POST", "PATCH"],
  },
});

// --- AMI Connection and Application Logic ---
const ami = new AmiClient();

// Make AMI and Socket.IO globally accessible
global.ami = ami;
global.amiReady = false;
global.io = io;

// Connect to AMI, then set up all event listeners and socket connections.
ami
  .connect(AMI_USERNAME, AMI_PASSWORD, { host: AMI_HOST, port: AMI_PORT })
  .then(() => {
    console.log("✅ [AMI] Connected successfully!");
    global.amiReady = true;

    // CRITICAL: Set up the AMI event listeners ONCE after a successful connection.
    setupAmiEventListeners(ami, io);
    
    // Initialize queue statistics scheduler
    scheduleQueueStatsCalculation();
    // Handle individual client (browser) connections.
    io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // When a new client connects, send them the current state immediately.
      // This ensures their dashboard is populated without waiting for a new event.
      
      // Send current queue members to new clients
      const { emitQueueMembersStatus } = require("./config/amiConfig");
      // For individual socket, we need to emit directly
      const flattenedMembers = [];
      Object.keys(state.queueMembers).forEach(queueId => {
        state.queueMembers[queueId].forEach(member => {
          flattenedMembers.push({
            ...member,
            queueName: global.queueNameMap?.[queueId] || queueId
          });
        });
      });
      socket.emit("queueMembers", flattenedMembers);

      // Send current enriched agent status if available
      if (Object.keys(agentState.agents).length > 0) {
        emitAgentStatusOnly(socket); // Send to this specific socket
      }

      // Send current queue statistics if available
      const { emitAllQueueStats } = require("./controllers/queueControllers/realTimeQueueStats");
      emitAllQueueStats(socket);

      // Send current ongoing calls to new clients immediately
      // socket.emit("ongoingCalls", Object.values(state.ongoingCalls));
      console.log(`📞 Sent ${Object.keys(state.ongoingCalls).length} ongoing calls to new client ${socket.id}`);

      // Handle request for current agent list - now uses enriched data.
      socket.on("on-going-calles", ()=>{
        io.emit('ongoingCalls',Object.values(state.ongoingCalls))
        io.emit('queueStatus', Object.values(state.queueCallers))
      })
      socket.on("requestAgentList", () => {
        try {
          if (!global.amiReady) {
            socket.emit("agentListError", { error: "AMI not connected" });
            return;
          }

          // Send the enriched agent data immediately from memory
          emitAgentStatusOnly(socket);
        } catch (error) {
          socket.emit("agentListError", { error: error.message });
        }
      });

      // Handle request for current queue statistics
      socket.on("requestAllQueueStats", () => {
        try {
          if (!global.amiReady) {
            socket.emit("queueStatsError", { error: "AMI not connected" });
            return;
          }

          // Send current queue statistics
          const { emitAllQueueStats } = require("./controllers/queueControllers/realTimeQueueStats");
          emitAllQueueStats(socket);
        } catch (error) {
          console.error("Error sending queue stats:", error);
          socket.emit("queueStatsError", { error: error.message });
        }
      });

      // Handle events received FROM this specific client.
      socket.on("hangupCall", (linkedId) => {
        if (!linkedId) return;

        console.log(
          `Client ${socket.id} requested hangup for call: ${linkedId}`
        );
        const call = state.ongoingCalls[linkedId];

        if (call && call.channels) {
          // Hang up every channel associated with the call
          call.channels.forEach((channel) => {
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
    console.error(
      "❌ [AMI] Connection failed. The application cannot start.",
      err
    );
    // Exit the process if we can't connect to Asterisk, as the app is non-functional.
    process.exit(1);
  });

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});
