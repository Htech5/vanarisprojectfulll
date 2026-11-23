const express = require('express');
const jwt = require('jsonwebtoken');
const { handleUpload } = require('@vercel/blob/client');
const h = require('../lib/asyncHandler');

const router = express.Router();

// Mounted with no authMiddleware on purpose: Vercel Blob calls this same
// endpoint twice — once from our own client (which we gate below via the JWT
// passed as clientPayload) and once as a server-to-server completion webhook
// that carries no Authorization header of ours at all.
router.post(
  '/',
  h(async (req, res) => {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        try {
          jwt.verify(clientPayload, process.env.JWT_SECRET);
        } catch {
          throw new Error('Unauthorized');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
          addRandomSuffix: true,
          maximumSizeInBytes: 15 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });
    res.json(jsonResponse);
  })
);

module.exports = router;
