const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/admin.middleware');

const { getDemandes, getDemandeById, createDemande, updateStatut, getMesDemandes } = require('../controllers/demandes.controller');
const { getAllTuteurs: getTuteurs, getMonProfil: getTuteurById, devenirTuteur, updateDisponibilite } = require('../controllers/tuteurs.controller');
const { proposerAide, getMesSessions, updateSessionStatut, getSessionsPendantes, acceptSession, refuseSession, terminerSession } = require('../controllers/sessions.controller');
const { getMessages, sendMessage, getConversations } = require('../controllers/messages.controller');
const { createEvaluation, getEvaluationsTuteur, getMesEvaluations } = require('../controllers/evaluations.controller');
const { getMatieres, createMatiere, getNotifications, marquerLues } = require('../controllers/misc.controller');

// ── DEMANDES ──────────────────────────────────────────────
router.get('/demandes',           auth, getDemandes);
router.get('/demandes/mes',       auth, getMesDemandes);
router.get('/demandes/:id',       auth, getDemandeById);
router.post('/demandes',          auth, createDemande);
router.patch('/demandes/:id/statut', auth, updateStatut);

// ── TUTEURS ───────────────────────────────────────────────
router.get('/tuteurs',                  auth, getTuteurs);
router.get('/tuteurs/:id',              auth, getTuteurById);
router.post('/tuteurs',                 auth, devenirTuteur);
router.patch('/tuteurs/disponibilite',  auth, updateDisponibilite);

// ── SESSIONS ──────────────────────────────────────────────
router.post('/sessions',              auth, proposerAide);
router.get('/sessions/mes',           auth, getMesSessions);
router.get('/sessions/attente',       auth, getSessionsPendantes);
router.patch('/sessions/:id/statut',  auth, updateSessionStatut);
router.patch('/sessions/:id/accepter', auth, acceptSession);
router.patch('/sessions/:id/refuser', auth, refuseSession);
router.patch('/sessions/:id/terminer', auth, terminerSession);

// ── MESSAGES ──────────────────────────────────────────────
router.get('/messages/conversations',       auth, getConversations);
router.get('/messages/:sessionId',          auth, getMessages);
router.post('/messages/:sessionId',         auth, sendMessage);

// ── ÉVALUATIONS ───────────────────────────────────────────
router.post('/evaluations',                     auth, createEvaluation);
router.get('/evaluations/mes',                  auth, getMesEvaluations);
router.get('/evaluations/tuteur/:tuteurId',     auth, getEvaluationsTuteur);

// ── MATIÈRES ──────────────────────────────────────────────
router.get('/matieres',         auth, getMatieres);
router.post('/matieres',        auth, isAdmin, createMatiere);

// ── NOTIFICATIONS ─────────────────────────────────────────
router.get('/notifications',          auth, getNotifications);
router.patch('/notifications/lire',   auth, marquerLues);

module.exports = router;