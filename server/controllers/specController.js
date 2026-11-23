const { specs } = require('../data');

exports.list = (_req, res) => res.json(specs);

exports.get = (req, res) => {
  const spec = specs.find((s) => s.id === req.params.id);
  if (!spec) return res.status(404).json({ error: 'Spec not found' });
  res.json(spec);
};
