require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { specs } = require('./data');
const live = require('./live');
const authRoutes = require('./routes/auth');
const droneRoutes = require('./routes/drones');

// Last-resort safety net: a DB hiccup (Neon asleep, network blip, ...) must
// never take the whole process down. Log it and keep serving.
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

// Wraps an async route handler so a rejected promise reaches Express's
// error middleware instead of crashing the process or hanging the request.
const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/models', express.static(path.join(__dirname, 'models')));

app.use('/api/auth', authRoutes);
app.use('/api/drones', droneRoutes);

app.get('/api/specs', (_req, res) => res.json(specs));

app.get('/api/specs/:id', (req, res) => {
  const spec = specs.find((s) => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Spec not found' });
  res.json(spec);
});

app.get(
  '/api/telemetry',
  h(async (_req, res) => res.json(await live.getAllTelemetry()))
);

app.get(
  '/api/telemetry/:droneId',
  h(async (req, res) => {
    const telemetry = await live.getTelemetry(req.params.droneId);
    if (!telemetry) return res.status(404).json({ error: 'Drone not found' });
    res.json(telemetry);
  })
);

app.get(
  '/api/alerts',
  h(async (_req, res) => res.json(await live.getAlerts()))
);

app.get(
  '/api/alerts/:id',
  h(async (req, res) => {
    const alert = await live.getAlert(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  })
);

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
