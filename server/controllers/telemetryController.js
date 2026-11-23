const live = require('../live');

exports.list = async (_req, res) => res.json(await live.getAllTelemetry());

exports.get = async (req, res) => {
  const telemetry = await live.getTelemetry(req.params.droneId);
  if (!telemetry) return res.status(404).json({ error: 'Drone not found' });
  res.json(telemetry);
};
