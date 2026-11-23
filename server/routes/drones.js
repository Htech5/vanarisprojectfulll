const express = require('express');
const { authMiddleware } = require('../lib/auth');
const h = require('../lib/asyncHandler');
const droneController = require('../controllers/droneController');

const router = express.Router();

router.get('/', h(droneController.list));
router.get('/:id', h(droneController.get));
router.post('/', authMiddleware, h(droneController.create));
router.put('/:id', authMiddleware, h(droneController.update));
router.delete('/:id', authMiddleware, h(droneController.remove));

module.exports = router;
