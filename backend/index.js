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
const { scheduleDailyMetricsCalculation } = require("./utils/dailyMetricsScheduler");

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
// Ensure global state objects are always initialized
global.state = global.state || {};
global.agentState = global.agentState || { agents: {} };

// Connect to AMI, then set up all event listeners and socket connections.
ami.connect(AMI_USERNAME, AMI_PASSWORD, { host: AMI_HOST, port: AMI_PORT })
  .then(() => {
    console.log("✅ [AMI] Connected successfully!");
    global.amiReady = true;

    try {
      setupAmiEventListeners(ami, io);
    } catch (err) {
      console.error("❌ Error setting up AMI event listeners:", err);
    }

    try {
      scheduleQueueStatsCalculation();
      scheduleDailyMetricsCalculation();
    } catch (err) {
      console.error("❌ Error initializing schedulers:", err);
    }

    io.on("connection", (socket) => {
      try {
        console.log(`🔌 Client connected: ${socket.id}`);
        const { emitQueueMembersStatus } = require("./config/amiConfig");
        const flattenedMembers = [];
        Object.keys(state.queueMembers || {}).forEach(queueId => {
          (state.queueMembers[queueId] || []).forEach(member => {
            flattenedMembers.push({
              ...member,
              queueName: global.queueNameMap?.[queueId] || queueId
            });
          });
        });
        socket.emit("queueMembers", flattenedMembers);

        if (agentState && agentState.agents && Object.keys(agentState.agents).length > 0) {
          emitAgentStatusOnly(socket);
        }

        const { emitAllQueueStats } = require("./controllers/queueControllers/realTimeQueueStats");
        emitAllQueueStats(socket);

        console.log(`📞 Sent ${Object.keys(state.ongoingCalls || {}).length} ongoing calls to new client ${socket.id}`);

        io.on("on-going-calles", ()=>{
          io.emit('ongoingCalls',Object.values(state.ongoingCalls || {}))
          io.emit('queueStatus', Object.values(state.queueCallers || {}))
        });
      } catch (err) {
        console.error("❌ Error handling new socket connection:", err);
      }
    });
  });

      // Handle request for current queue statistics
      io.on("requestAllQueueStats", () => {
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
      io.on("hangupCall", (linkedId) => {
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

      io.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`🚀 Server is live and listening on port ${PORT}`);
});
