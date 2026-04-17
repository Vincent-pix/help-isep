const express = require('express');
const router = express.Router();

const {
  getDemandesOuvertes,
  createDemande,
  getDemandeById,
  updateStatutDemande,
} = require('../controllers/demandes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Toutes les routes demandes sont protégées
router.use(authMiddleware);

// GET  /api/demandes       — liste des demandes ouvertes
router.get('/', getDemandesOuvertes);

// POST /api/demandes       — créer une demande
router.post('/', createDemande);

// GET  /api/demandes/:id   — détail d'une demande
router.get('/:id', getDemandeById);

// PATCH /api/demandes/:id/statut — changer le statut
router.patch('/:id/statut', updateStatutDemande);

module.exports = router;
