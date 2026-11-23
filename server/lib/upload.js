const multer = require('multer');

/** Memory storage (not disk): required on Vercel, where the filesystem
 * is read-only/ephemeral. The route converts req.file.buffer into a
 * base64 data URI and stores that string directly in Postgres. */
function makeUploader() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  });
}

function toDataUri(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

module.exports = { makeUploader, toDataUri };
