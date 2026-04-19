const express = require('express');
const router = express.Router();

const { register, login, getMe, getProfile } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (route protégée)
router.get('/me', authMiddleware, getMe);

// GET /api/auth/profile  (route protégée avec stats)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
