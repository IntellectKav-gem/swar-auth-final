const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many authentication attempts. Please try again later.' });

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

module.exports = router;
