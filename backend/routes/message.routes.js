const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/message.controller');
const authMW = require('../middleware/auth.middleware');

// GET /api/messages/:sessionId - Messages d'une session
router.get('/:sessionId', authMW, getMessages);

// POST /api/messages/:sessionId - Envoyer message
router.post('/:sessionId', authMW, sendMessage);

module.exports = router;