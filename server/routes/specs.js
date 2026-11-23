const express = require('express');
const specController = require('../controllers/specController');

const router = express.Router();

router.get('/', specController.list);
router.get('/:id', specController.get);

module.exports = router;
