// =========================
// Imports
// =========================
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const agentRoutes = require("./routes/agent");
const queueRoutes = require("./routes/queueRoutes");
const reportRoutes = require("./routes/report");
const ivrRoutes = require('./routes/ivrRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const morgan = require("morgan");
const miscApplicationRoute = require("./routes/miscApplication");
const applyConfigRoute = require("./routes/applyConfig");
// =========================
// App Initialization
// =========================
const app = express();

// =========================
// Database Connection
// =========================
connectDB();

// =========================
// Middleware
// =========================
app.use(express.json());
app.use(cors());                                            
app.use(morgan('dev'));
app.use('/recordings', express.static('/var/lib/asterisk/sounds/en/custom'))

app.get('/recordings', (req, res) => {
  const recordingsDir = '/var/lib/asterisk/sounds/en/custom'
  const files = fs.readdirSync(recordingsDir)
    .filter(f => f.endsWith('.wav') || f.endsWith('.gsm'))
    .map(f => f.replace(/\.(wav|gsm)$/, '')) // remove extension

  res.json(files) // [ 'welcome-message', 'main-ivr', ... ]
})
// =========================
// API Routes
// =========================
app.use("/api/agent", agentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/report", reportRoutes);

// Apply config route
app.use("/api/apply-config", applyConfigRoute);

// IVR Routes
app.use('/api/ivr', ivrRoutes);
app.use('/api/audio', recordingRoutes);

// Misc Application Route
app.use("/api/misc", miscApplicationRoute);

// =========================
// Export App
// =========================
module.exports = app;
