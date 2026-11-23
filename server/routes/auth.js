const express = require('express');
const { authMiddleware } = require('../lib/auth');
const h = require('../lib/asyncHandler');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', h(authController.register));
router.post('/login', h(authController.login));
router.get('/me', authMiddleware, h(authController.getMe));
router.put('/me', authMiddleware, h(authController.updateMe));

module.exports = router;
