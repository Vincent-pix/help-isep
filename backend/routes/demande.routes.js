const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMW = require('../middleware/auth.middleware');

// GET /api/demandes - Récupérer toutes les demandes
router.get('/', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, u.nom AS eleve_nom, u.prenom AS eleve_prenom, m.nom AS matiere_nom
      FROM demandes_aide d
      JOIN utilisateurs u ON u.id = d.eleve_id
      LEFT JOIN matieres m ON m.id = d.matiere_id
      ORDER BY FIELD(d.urgence,'haute','normale','faible'), d.date_creation DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET demandes:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/demandes - Créer une nouvelle demande
router.post('/', authMW, async (req, res) => {
  const { matiere_id, titre, description, urgence } = req.body;
  
  if (!matiere_id || !titre || !description) {
    return res.status(400).json({ message: 'Champs manquants: matiere_id, titre, description' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO demandes_aide (eleve_id, matiere_id, titre, description, urgence, statut) VALUES (?,?,?,?,?,?)',
      [req.user.id, matiere_id, titre, description, urgence || 'normale', 'ouverte']
    );
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Demande créée',
      demande_id: result.insertId
    });
  } catch (err) {
    console.error('Erreur POST demande:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/demandes/:id - Récupérer une demande spécifique
router.get('/:id', authMW, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, u.nom AS eleve_nom, u.prenom AS eleve_prenom, m.nom AS matiere_nom
       FROM demandes_aide d
       JOIN utilisateurs u ON u.id = d.eleve_id
       LEFT JOIN matieres m ON m.id = d.matiere_id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Demande non trouvée' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur GET demande/:id:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
