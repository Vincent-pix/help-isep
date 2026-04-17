const db = require('../config/db');

// ─────────────────────────────────────────
// POST /api/sessions
// Créer une session de tutorat
// ─────────────────────────────────────────
const createSession = async (req, res) => {
  const { demande_id } = req.body;

  if (!demande_id) {
    return res.status(400).json({ message: 'ID de demande requis' });
  }

  try {
    const [demande] = await db.query(
      'SELECT * FROM demandes_aide WHERE id = ? AND statut = ?',
      [demande_id, 'ouverte']
    );
    if (demande.length === 0) {
      return res.status(404).json({ message: 'Demande non trouvée ou non ouverte' });
    }

    const [result] = await db.query(
      'INSERT INTO sessions_aide (demande_id, tuteur_id) VALUES (?, ?)',
      [demande_id, req.user.id]
    );

    await db.query(
      'UPDATE demandes_aide SET statut = ? WHERE id = ?',
      ['proposee', demande_id]
    );

    res.status(201).json({ id: result.insertId, message: 'Session proposée' });
  } catch (error) {
    console.error('[createSession]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// GET /api/sessions/mes-sessions
// Mes sessions (en tant qu'élève ou tuteur)
// ─────────────────────────────────────────
const getMesSessions = async (req, res) => {
  try {
    const query = `
      SELECT
        s.id,
        s.demande_id,
        s.statut,
        s.date_proposition AS date_creation,
        d.titre,
        d.description,
        m.nom AS matiere,
        CASE WHEN s.tuteur_id = ? THEN 'tuteur' ELSE 'eleve' END AS mon_role,
        u_e.nom AS eleve_nom,
        u_e.prenom AS eleve_prenom,
        u_t.nom AS tuteur_nom,
        u_t.prenom AS tuteur_prenom
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u_e ON u_e.id = d.eleve_id
      JOIN utilisateurs u_t ON u_t.id = s.tuteur_id
      WHERE s.tuteur_id = ? OR d.eleve_id = ?
      ORDER BY s.date_proposition DESC
    `;
    const [rows] = await db.query(query, [req.user.id, req.user.id, req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('[getMesSessions]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// PUT /api/sessions/:id/accepter
// Accepter une session (tuteur)
// ─────────────────────────────────────────
const accepterSession = async (req, res) => {
  const { id } = req.params;

  try {
    const [session] = await db.query(
      'SELECT * FROM sessions_aide WHERE id = ? AND tuteur_id = ? AND statut = ?',
      [id, req.user.id, 'proposee']
    );
    if (session.length === 0) {
      return res.status(404).json({ message: 'Session non trouvée ou non autorisée' });
    }

    await db.query(
      'UPDATE sessions_aide SET statut = ? WHERE id = ?',
      ['acceptee', id]
    );

    res.json({ message: 'Session acceptée' });
  } catch (error) {
    console.error('[accepterSession]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// PUT /api/sessions/:id/refuser
// Refuser une session (tuteur)
// ─────────────────────────────────────────
const refuserSession = async (req, res) => {
  const { id } = req.params;

  try {
    const [session] = await db.query(
      'SELECT * FROM sessions_aide WHERE id = ? AND tuteur_id = ? AND statut = ?',
      [id, req.user.id, 'proposee']
    );
    if (session.length === 0) {
      return res.status(404).json({ message: 'Session non trouvée ou non autorisée' });
    }

    await db.query(
      'UPDATE sessions_aide SET statut = ? WHERE id = ?',
      ['refusee', id]
    );

    await db.query(
      'UPDATE demandes_aide SET statut = ? WHERE id = ?',
      ['ouverte', session[0].demande_id]
    );

    res.json({ message: 'Session refusée' });
  } catch (error) {
    console.error('[refuserSession]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createSession, getMesSessions, accepterSession, refuserSession };