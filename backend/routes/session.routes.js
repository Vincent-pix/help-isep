const express = require('express');
const router = express.Router();
const { createSession, getMesSessions, accepterSession, refuserSession } = require('../controllers/session.controller');
const authMW = require('../middleware/auth.middleware');

// POST /api/sessions - Créer une session
router.post('/', authMW, createSession);

// GET /api/sessions/mes-sessions - Mes sessions
router.get('/mes-sessions', authMW, getMesSessions);

// PUT /api/sessions/:id/accepter - Accepter session
router.put('/:id/accepter', authMW, accepterSession);

// PUT /api/sessions/:id/refuser - Refuser session
router.put('/:id/refuser', authMW, refuserSession);

module.exports = router;