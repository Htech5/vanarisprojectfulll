const express = require('express');
const prisma = require('../lib/prisma');
const { hashPassword, verifyPassword, signToken, authMiddleware } = require('../lib/auth');
const { makeUploader, toDataUri } = require('../lib/upload');
const h = require('../lib/asyncHandler');

const upload = makeUploader();
const router = express.Router();

function passwordError(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password needs a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password needs an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password needs a number';
  return null;
}

router.post(
  '/register',
  h(async (req, res) => {
    const { username, password, displayName } = req.body;
    if (!username?.trim() || !password || !displayName?.trim()) {
      return res.status(400).json({ error: 'Username, password, and display name are required' });
    }
    const pwError = passwordError(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        displayName: displayName.trim(),
        passwordHash: await hashPassword(password),
      },
    });
    res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
  })
);

router.post(
  '/login',
  h(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ token: signToken(user), user: toPublicUser(user) });
  })
);

router.get(
  '/me',
  authMiddleware,
  h(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(toPublicUser(user));
  })
);

router.put(
  '/me',
  authMiddleware,
  upload.single('avatar'),
  h(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const { displayName, password } = req.body;
    if (displayName !== undefined && !displayName.trim()) {
      return res.status(400).json({ error: 'Display name cannot be empty' });
    }
    if (password) {
      const pwError = passwordError(password);
      if (pwError) return res.status(400).json({ error: pwError });
    }

    const avatar = req.file ? toDataUri(req.file) : existing.avatar;

    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: {
        displayName: displayName?.trim() ?? existing.displayName,
        passwordHash: password ? await hashPassword(password) : existing.passwordHash,
        avatar,
      },
    });
    res.json(toPublicUser(user));
  })
);

function toPublicUser(user) {
  return { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar };
}

module.exports = router;
