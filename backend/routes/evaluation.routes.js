const express = require('express');
const router = express.Router();
const { createEvaluation, getMesEvaluations } = require('../controllers/evaluation.controller');
const authMW = require('../middleware/auth.middleware');

// POST /api/evaluations - Créer évaluation
router.post('/', authMW, createEvaluation);

// GET /api/evaluations/mes-evals - Mes évaluations
router.get('/mes-evals', authMW, getMesEvaluations);

module.exports = router;