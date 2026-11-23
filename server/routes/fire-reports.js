const express = require('express');
const { authMiddleware } = require('../lib/auth');
const h = require('../lib/asyncHandler');
const fireReportController = require('../controllers/fireReportController');

const router = express.Router();

router.get('/', h(fireReportController.list));
router.get('/:id', h(fireReportController.get));
router.post('/', authMiddleware, h(fireReportController.create));
router.put('/:id', authMiddleware, h(fireReportController.update));
router.delete('/:id', authMiddleware, h(fireReportController.remove));

module.exports = router;
