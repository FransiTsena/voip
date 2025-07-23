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
const cookieParser = require("cookie-parser");
const miscApplicationRoute = require("./routes/miscApplication");
const applyConfigRoute = require("./routes/applyConfig");
const shiftRoutes = require('./routes/shiftRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const customerRoutes = require('./routes/customerRoutes');
const kbRoutes = require('./routes/kbRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const callRoutes = require('./routes/callRoutes');
const authRoutes = require('./routes/auth');
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
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend URL
  credentials: true
}));
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

// Shift Routes
app.use('/api/shifts', shiftRoutes);

// Ticket Routes
app.use('/api/tickets', ticketRoutes);

// Customer Routes
app.use('/api/customers', customerRoutes);

// Knowledge Base Routes
app.use('/api/kb', kbRoutes);

// Metrics Routes
app.use('/api/metrics', metricsRoutes);

// Call Routes
app.use('/api/call', callRoutes);
app.use("/api/auth", authRoutes); // Register the new auth route

// =========================
// Export App
// =========================
module.exports = app;
