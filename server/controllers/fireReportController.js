const prisma = require('../lib/prisma');

function toPublic(report) {
  return {
    id: report.id,
    userId: report.userId,
    title: report.title,
    image: report.image,
    lat: report.lat,
    lng: report.lng,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

exports.list = async (_req, res) => {
  const reports = await prisma.fireReport.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(reports.map(toPublic));
};

exports.get = async (req, res) => {
  const report = await prisma.fireReport.findUnique({ where: { id: req.params.id } });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(toPublic(report));
};

exports.create = async (req, res) => {
  const { title, lat, lng, image } = req.body;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res.status(400).json({ error: 'A map location is required' });
  }
  const report = await prisma.fireReport.create({
    data: {
      userId: req.user.sub,
      title: title.trim(),
      lat: latNum,
      lng: lngNum,
      // image is a Vercel Blob URL the client already uploaded.
      image: image || null,
    },
  });
  res.status(201).json(toPublic(report));
};

exports.update = async (req, res) => {
  const existing = await prisma.fireReport.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Report not found' });
  if (existing.userId !== req.user.sub) {
    return res.status(403).json({ error: 'You can only edit your own reports' });
  }

  const { title, lat, lng, image } = req.body;
  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }
  const latNum = lat !== undefined ? Number(lat) : existing.lat;
  const lngNum = lng !== undefined ? Number(lng) : existing.lng;
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res.status(400).json({ error: 'A map location is required' });
  }

  const report = await prisma.fireReport.update({
    where: { id: req.params.id },
    data: {
      title: title?.trim() ?? existing.title,
      lat: latNum,
      lng: lngNum,
      image: image !== undefined ? image : existing.image,
    },
  });
  res.json(toPublic(report));
};

exports.remove = async (req, res) => {
  const existing = await prisma.fireReport.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Report not found' });
  if (existing.userId !== req.user.sub) {
    return res.status(403).json({ error: 'You can only delete your own reports' });
  }
  await prisma.fireReport.delete({ where: { id: req.params.id } });
  res.status(204).end();
};
