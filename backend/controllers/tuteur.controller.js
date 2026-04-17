const db = require('../config/db');

// ─────────────────────────────────────────
// GET /api/tuteurs
// Liste tous les tuteurs disponibles
// ─────────────────────────────────────────
const getAllTuteurs = async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM vue_tuteurs_disponibles
      ORDER BY note_moyenne DESC, nb_sessions DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('[getAllTuteurs]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// GET /api/tuteurs/mon-profil
// Profil du tuteur connecté
// ─────────────────────────────────────────
const getMonProfil = async (req, res) => {
  try {
    const query = `
      SELECT
        u.id,
        u.nom,
        u.prenom,
        u.photo_profil,
        u.bio,
        pt.note_moyenne,
        pt.nb_sessions,
        GROUP_CONCAT(DISTINCT m.nom SEPARATOR ', ') AS matieres
      FROM profils_tuteurs pt
      JOIN utilisateurs u ON u.id = pt.utilisateur_id
      LEFT JOIN competences_tuteurs ct ON ct.tuteur_id = pt.id
      LEFT JOIN matieres m ON m.id = ct.matiere_id
      WHERE pt.utilisateur_id = ?
      GROUP BY pt.id
    `;
    const [rows] = await db.query(query, [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('[getMonProfil]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// POST /api/tuteurs/devenir-tuteur
// Devenir tuteur
// ─────────────────────────────────────────
const devenirTuteur = async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM profils_tuteurs WHERE utilisateur_id = ?',
      [req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Vous êtes déjà tuteur' });
    }

    await db.query(
      'INSERT INTO profils_tuteurs (utilisateur_id, disponible) VALUES (?, TRUE)',
      [req.user.id]
    );

    res.json({ message: 'Vous êtes maintenant tuteur' });
  } catch (error) {
    console.error('[devenirTuteur]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAllTuteurs, getMonProfil, devenirTuteur };