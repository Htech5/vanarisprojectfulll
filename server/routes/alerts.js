const express = require('express');
const h = require('../lib/asyncHandler');
const alertController = require('../controllers/alertController');

const router = express.Router();

router.get('/', h(alertController.list));
router.get('/:id', h(alertController.get));

module.exports = router;
