const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/matieres - Récupérer toutes les matières
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM matieres ORDER BY nom');
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET matieres:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
