const express = require('express');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../lib/auth');
const { makeUploader, toDataUri } = require('../lib/upload');
const h = require('../lib/asyncHandler');

const upload = makeUploader();
const router = express.Router();

router.get(
  '/',
  h(async (_req, res) => {
    res.json(await prisma.drone.findMany({ orderBy: { createdAt: 'asc' } }));
  })
);

router.get(
  '/:id',
  h(async (req, res) => {
    const drone = await prisma.drone.findUnique({ where: { id: req.params.id } });
    if (!drone) return res.status(404).json({ error: 'Drone not found' });
    res.json(drone);
  })
);

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  h(async (req, res) => {
    const { name, tagline, status, badge } = req.body;
    if (!name?.trim() || !tagline?.trim()) {
      return res.status(400).json({ error: 'Name and tagline are required' });
    }
    const drone = await prisma.drone.create({
      data: {
        name: name.trim(),
        tagline: tagline.trim(),
        status: status || 'standby',
        badge: badge || null,
        image: req.file ? toDataUri(req.file) : null,
      },
    });
    res.status(201).json(drone);
  })
);

router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  h(async (req, res) => {
    const existing = await prisma.drone.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Drone not found' });

    const { name, tagline, status, badge } = req.body;
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    if (tagline !== undefined && !tagline.trim()) {
      return res.status(400).json({ error: 'Tagline cannot be empty' });
    }

    const image = req.file ? toDataUri(req.file) : existing.image;

    const drone = await prisma.drone.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() ?? existing.name,
        tagline: tagline?.trim() ?? existing.tagline,
        status: status ?? existing.status,
        badge: badge === undefined ? existing.badge : badge || null,
        image,
      },
    });
    res.json(drone);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  h(async (req, res) => {
    const existing = await prisma.drone.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Drone not found' });
    await prisma.drone.delete({ where: { id: req.params.id } });
    require('../live').dropTelemetry(req.params.id);
    res.status(204).end();
  })
);

module.exports = router;
