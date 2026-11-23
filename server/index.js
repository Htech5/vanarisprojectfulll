require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const droneRoutes = require('./routes/drones');
const fireReportRoutes = require('./routes/fire-reports');
const blobUploadRoutes = require('./routes/blob-upload');
const specRoutes = require('./routes/specs');
const telemetryRoutes = require('./routes/telemetry');
const alertRoutes = require('./routes/alerts');

// Last-resort safety net: a DB hiccup (Neon asleep, network blip, ...) must
// never take the whole process down. Log it and keep serving.
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/alerts', express.static(path.join(__dirname, 'public', 'alerts')));

app.use('/api/auth', authRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/fire-reports', fireReportRoutes);
app.use('/api/blob-upload', blobUploadRoutes);
app.use('/api/specs', specRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertRoutes);

// Centralized error JSON so the app can show a real message instead of a
// generic "Request failed: 500" — in particular, a sleeping/unreachable
// Neon database surfaces as a clear "temporarily unavailable" response.
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'P1001' || err.code === 'P1017') {
    return res.status(503).json({ error: 'Database is temporarily unavailable. Try again in a moment.' });
  }
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 4000;
// Vercel imports this file as a serverless handler (app itself is a valid
// (req, res) => {} function) — only bind a port for local/VM runs.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Vanaris API listening on :${PORT}`));
}
module.exports = app;
