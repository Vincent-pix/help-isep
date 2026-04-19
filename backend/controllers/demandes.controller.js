const db = require('../config/db');

// GET /api/demandes — toutes les demandes ouvertes
const getDemandes = async (req, res) => {
  try {
    const { matiere_id, urgence } = req.query;
    let query = `
      SELECT d.*, m.nom AS matiere, m.couleur,
             u.nom AS eleve_nom, u.prenom AS eleve_prenom
      FROM demandes_aide d
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u ON u.id = d.eleve_id
      WHERE d.statut = 'ouverte'
    `;
    const params = [];
    if (matiere_id) { query += ' AND d.matiere_id = ?'; params.push(matiere_id); }
    if (urgence)    { query += ' AND d.urgence = ?';    params.push(urgence); }
    query += ' ORDER BY FIELD(d.urgence,"haute","normale","faible"), d.date_creation DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erreur getDemandes :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/demandes/:id
const getDemandeById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, m.nom AS matiere, m.couleur,
             u.nom AS eleve_nom, u.prenom AS eleve_prenom, u.email AS eleve_email
      FROM demandes_aide d
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u ON u.id = d.eleve_id
      WHERE d.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur getDemandeById :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/demandes — créer une demande
const createDemande = async (req, res) => {
  const { matiere_id, titre, description, urgence } = req.body;
  if (!matiere_id || !titre || !description) {
    return res.status(400).json({ message: 'matiere_id, titre et description sont requis' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO demandes_aide (eleve_id, matiere_id, titre, description, urgence) VALUES (?,?,?,?,?)',
      [req.user.id, matiere_id, titre, description, urgence || 'normale']
    );
    res.status(201).json({ message: 'Demande créée', id: result.insertId });
  } catch (err) {
    console.error('Erreur createDemande :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/demandes/:id/statut
const updateStatut = async (req, res) => {
  const { statut } = req.body;
  const validStatuts = ['ouverte', 'en_cours', 'resolue', 'annulee'];
  if (!validStatuts.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM demandes_aide WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });

    // Seul l'élève qui a posté ou un admin peut modifier
    if (rows[0].eleve_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const dateResolution = statut === 'resolue' ? new Date() : null;
    await db.query(
      'UPDATE demandes_aide SET statut = ?, date_resolution = ? WHERE id = ?',
      [statut, dateResolution, req.params.id]
    );
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    console.error('Erreur updateStatut :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/demandes/mes — demandes de l'utilisateur connecté
const getMesDemandes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, m.nom AS matiere, m.couleur
      FROM demandes_aide d
      JOIN matieres m ON m.id = d.matiere_id
      WHERE d.eleve_id = ?
      ORDER BY d.date_creation DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Erreur getMesDemandes :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getDemandes, getDemandeById, createDemande, updateStatut, getMesDemandes };