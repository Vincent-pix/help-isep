const express = require('express');
const router = express.Router();
const { getAllTuteurs, getMonProfil, devenirTuteur } = require('../controllers/tuteur.controller');
const authMW = require('../middleware/auth.middleware');

// GET /api/tuteurs - Liste des tuteurs
router.get('/', authMW, getAllTuteurs);

// GET /api/tuteurs/mon-profil - Profil tuteur
router.get('/mon-profil', authMW, getMonProfil);

// POST /api/tuteurs/devenir-tuteur - Devenir tuteur
router.post('/devenir-tuteur', authMW, devenirTuteur);

module.exports = router;