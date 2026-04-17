const db = require('../config/db');

// ─────────────────────────────────────────
// POST /api/evaluations
// Créer une évaluation
// ─────────────────────────────────────────
const createEvaluation = async (req, res) => {
  const { session_id, note, commentaire = '' } = req.body;

  if (!session_id || !note || note < 1 || note > 5) {
    return res.status(400).json({ message: 'Données invalides' });
  }

  try {
    const [session] = await db.query(
      'SELECT s.* FROM sessions_aide s JOIN demandes_aide d ON d.id = s.demande_id WHERE s.id = ? AND s.statut = ? AND (s.tuteur_id = ? OR d.eleve_id = ?)',
      [session_id, 'terminee', req.user.id, req.user.id]
    );
    if (session.length === 0) {
      return res.status(404).json({ message: 'Session non trouvée ou non terminée' });
    }

    const [existing] = await db.query(
      'SELECT id FROM evaluations WHERE session_id = ?',
      [session_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Évaluation déjà existante' });
    }

    const [result] = await db.query(
      'INSERT INTO evaluations (session_id, note, commentaire, date_evaluation) VALUES (?, ?, ?, NOW())',
      [session_id, note, commentaire]
    );

    res.status(201).json({ id: result.insertId, message: 'Évaluation créée' });
  } catch (error) {
    console.error('[createEvaluation]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// ─────────────────────────────────────────
// GET /api/evaluations/mes-evals
// Mes évaluations reçues
// ─────────────────────────────────────────
const getMesEvaluations = async (req, res) => {
  try {
    const query = `
      SELECT
        e.id,
        e.note,
        e.commentaire,
        e.date_evaluation,
        s.id AS session_id,
        d.titre,
        u.nom AS autre_nom,
        u.prenom AS autre_prenom
      FROM evaluations e
      JOIN sessions_aide s ON s.id = e.session_id
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN utilisateurs u ON u.id = CASE WHEN s.tuteur_id = ? THEN d.eleve_id ELSE s.tuteur_id END
      WHERE s.tuteur_id = ? OR d.eleve_id = ?
      ORDER BY e.date_evaluation DESC
    `;
    const [rows] = await db.query(query, [req.user.id, req.user.id, req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('[getMesEvaluations]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createEvaluation, getMesEvaluations };