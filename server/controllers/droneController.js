const prisma = require('../lib/prisma');
const live = require('../live');

exports.list = async (_req, res) => {
  res.json(await prisma.drone.findMany({ orderBy: { createdAt: 'asc' } }));
};

exports.get = async (req, res) => {
  const drone = await prisma.drone.findUnique({ where: { id: req.params.id } });
  if (!drone) return res.status(404).json({ error: 'Drone not found' });
  res.json(drone);
};

exports.create = async (req, res) => {
  const { name, tagline, status, badge, image } = req.body;
  if (!name?.trim() || !tagline?.trim()) {
    return res.status(400).json({ error: 'Name and tagline are required' });
  }
  const drone = await prisma.drone.create({
    data: {
      name: name.trim(),
      tagline: tagline.trim(),
      status: status || 'standby',
      badge: badge || null,
      // image is a Vercel Blob URL the client already uploaded.
      image: image || null,
    },
  });
  res.status(201).json(drone);
};

exports.update = async (req, res) => {
  const existing = await prisma.drone.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Drone not found' });

  const { name, tagline, status, badge, image } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (tagline !== undefined && !tagline.trim()) {
    return res.status(400).json({ error: 'Tagline cannot be empty' });
  }

  const drone = await prisma.drone.update({
    where: { id: req.params.id },
    data: {
      name: name?.trim() ?? existing.name,
      tagline: tagline?.trim() ?? existing.tagline,
      status: status ?? existing.status,
      badge: badge === undefined ? existing.badge : badge || null,
      image: image !== undefined ? image : existing.image,
    },
  });
  res.json(drone);
};

exports.remove = async (req, res) => {
  const existing = await prisma.drone.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Drone not found' });
  await prisma.drone.delete({ where: { id: req.params.id } });
  live.dropTelemetry(req.params.id);
  res.status(204).end();
};
