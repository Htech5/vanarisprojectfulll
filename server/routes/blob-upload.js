const express = require('express');
const h = require('../lib/asyncHandler');
const blobUploadController = require('../controllers/blobUploadController');

const router = express.Router();

router.post('/', h(blobUploadController.generateToken));

module.exports = router;
