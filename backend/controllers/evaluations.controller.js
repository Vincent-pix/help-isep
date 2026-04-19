const db = require('../config/db');

// POST /api/evaluations — évaluer une session
const createEvaluation = async (req, res) => {
  const { session_id, note, commentaire } = req.body;

  if (!session_id || !note) {
    return res.status(400).json({ message: 'session_id et note requis' });
  }
  if (note < 1 || note > 5) {
    return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
  }

  try {
    // Vérifier que la session existe et est terminée
    const [session] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ? AND s.statut = 'terminee'
    `, [session_id]);

    if (session.length === 0) {
      return res.status(404).json({ message: 'Session introuvable ou non terminée' });
    }

    // Seul l'élève peut évaluer
    if (session[0].eleve_id !== req.user.id) {
      return res.status(403).json({ message: 'Seul l\'élève peut évaluer la session' });
    }

    // Vérifier qu'il n'y a pas déjà une évaluation
    const [existing] = await db.query(
      'SELECT id FROM evaluations WHERE session_id = ?', [session_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Session déjà évaluée' });
    }

    // Créer l'évaluation
    await db.query(
      'INSERT INTO evaluations (session_id, note, commentaire) VALUES (?,?,?)',
      [session_id, note, commentaire || null]
    );

    // Recalculer la note moyenne du tuteur
    await db.query(`
      UPDATE profils_tuteurs pt
      SET note_moyenne = (
        SELECT AVG(e.note)
        FROM evaluations e
        JOIN sessions_aide s ON s.id = e.session_id
        WHERE s.tuteur_id = pt.utilisateur_id
      )
      WHERE utilisateur_id = ?
    `, [session[0].tuteur_id]);

    res.status(201).json({ message: 'Évaluation enregistrée' });
  } catch (err) {
    console.error('Erreur createEvaluation :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/evaluations/tuteur/:tuteurId — évaluations d'un tuteur
const getEvaluationsTuteur = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, d.titre AS session_titre,
             u.nom AS eleve_nom, u.prenom AS eleve_prenom
      FROM evaluations e
      JOIN sessions_aide s ON s.id = e.session_id
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN utilisateurs u ON u.id = d.eleve_id
      WHERE s.tuteur_id = ?
      ORDER BY e.date_evaluation DESC
    `, [req.params.tuteurId]);
    res.json(rows);
  } catch (err) {
    console.error('Erreur getEvaluationsTuteur :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/evaluations/mes — évaluations reçues par l'utilisateur connecté (tuteur)
const getMesEvaluations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, d.titre AS session_titre, m.nom AS matiere,
             u.nom AS eleve_nom, u.prenom AS eleve_prenom
      FROM evaluations e
      JOIN sessions_aide s ON s.id = e.session_id
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u ON u.id = d.eleve_id
      WHERE s.tuteur_id = ?
      ORDER BY e.date_evaluation DESC
    `, [req.user.id]);

    // Stats globales
    const [stats] = await db.query(`
      SELECT COUNT(*) AS total, AVG(e.note) AS moyenne
      FROM evaluations e
      JOIN sessions_aide s ON s.id = e.session_id
      WHERE s.tuteur_id = ?
    `, [req.user.id]);

    res.json({ evaluations: rows, stats: stats[0] });
  } catch (err) {
    console.error('Erreur getMesEvaluations :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createEvaluation, getEvaluationsTuteur, getMesEvaluations };