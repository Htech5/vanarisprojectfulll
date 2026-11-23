const live = require('../live');

exports.list = async (_req, res) => res.json(await live.getAlerts());

exports.get = async (req, res) => {
  const alert = await live.getAlert(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
};
