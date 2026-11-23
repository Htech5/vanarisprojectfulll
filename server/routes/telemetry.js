const express = require('express');
const h = require('../lib/asyncHandler');
const telemetryController = require('../controllers/telemetryController');

const router = express.Router();

router.get('/', h(telemetryController.list));
router.get('/:droneId', h(telemetryController.get));

module.exports = router;
