const db = require('../config/db');

// POST /api/sessions — proposer son aide sur une demande
const proposerAide = async (req, res) => {
  const { demande_id } = req.body;
  if (!demande_id) return res.status(400).json({ message: 'demande_id requis' });

  try {
    // Vérifier que la demande existe et est ouverte
    const [demande] = await db.query(
      'SELECT * FROM demandes_aide WHERE id = ? AND statut = "ouverte"',
      [demande_id]
    );
    if (demande.length === 0) {
      return res.status(404).json({ message: 'Demande introuvable ou déjà prise en charge' });
    }

    // Vérifier que l'utilisateur n'est pas l'auteur de la demande
    if (demande[0].eleve_id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas répondre à votre propre demande' });
    }

    // Vérifier qu'une session n'existe pas déjà pour ce tuteur/demande
    const [existing] = await db.query(
      'SELECT id FROM sessions_aide WHERE demande_id = ? AND tuteur_id = ?',
      [demande_id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Vous avez déjà proposé votre aide' });
    }

    const [result] = await db.query(
      'INSERT INTO sessions_aide (demande_id, tuteur_id) VALUES (?, ?)',
      [demande_id, req.user.id]
    );

    // Mettre la demande en "en_cours"
    await db.query(
      'UPDATE demandes_aide SET statut = "en_cours" WHERE id = ?',
      [demande_id]
    );

    // Créer une notification pour l'élève
    await db.query(
      'INSERT INTO notifications (utilisateur_id, type, message, lien) VALUES (?,?,?,?)',
      [demande[0].eleve_id, 'session_proposee',
       'Un tuteur a proposé de t\'aider !',
       `/sessions/${result.insertId}`]
    );

    res.status(201).json({ message: 'Aide proposée', sessionId: result.insertId });
  } catch (err) {
    console.error('Erreur proposerAide :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/sessions/mes — sessions de l'utilisateur avec détails complets
const getMesSessions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*,
             d.titre AS demande_titre, d.description AS demande_desc, d.urgence,
             m.nom AS matiere,
             u_eleve.id AS eleve_id, u_eleve.nom AS eleve_nom, u_eleve.prenom AS eleve_prenom,
             u_tuteur.id AS tuteur_id, u_tuteur.nom AS tuteur_nom, u_tuteur.prenom AS tuteur_prenom,
             (SELECT COUNT(*) FROM messages WHERE session_id = s.id AND lu = false AND expediteur_id != ?) AS messages_non_lus,
             (SELECT note FROM evaluations WHERE session_id = s.id LIMIT 1) AS note_evaluation
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u_eleve ON u_eleve.id = d.eleve_id
      JOIN utilisateurs u_tuteur ON u_tuteur.id = s.tuteur_id
      WHERE d.eleve_id = ? OR s.tuteur_id = ?
      ORDER BY s.date_proposition DESC
    `, [req.user.id, req.user.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Erreur getMesSessions :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/sessions/:id/statut — accepter/refuser/terminer (legacy, uses individual endpoints now)
const updateSessionStatut = async (req, res) => {
  const { statut } = req.body;
  const validStatuts = ['acceptee', 'refusee', 'en_cours', 'terminee'];
  if (!validStatuts.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }
  try {
    const [rows] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Session introuvable' });
    const session = rows[0];

    // Seul l'élève peut accepter/refuser, seul le tuteur peut terminer
    if (['acceptee', 'refusee'].includes(statut) && session.eleve_id !== req.user.id) {
      return res.status(403).json({ message: 'Seul l\'élève peut accepter ou refuser' });
    }
    if (statut === 'terminee' && session.tuteur_id !== req.user.id) {
      return res.status(403).json({ message: 'Seul le tuteur peut terminer la session' });
    }

    let setSql = 'statut = ?';
    const params = [statut];
    
    if (statut === 'acceptee') {
      setSql += ', date_debut = NOW()';
    }
    if (statut === 'terminee') {
      setSql += ', date_fin = NOW()';
      // Incrémenter nb_sessions du tuteur
      await db.query(`
        UPDATE profils_tuteurs SET nb_sessions = nb_sessions + 1
        WHERE utilisateur_id = ?
      `, [session.tuteur_id]);
    }
    params.push(req.params.id);
    
    await db.query(`UPDATE sessions_aide SET ${setSql} WHERE id = ?`, params);
    res.json({ message: 'Session mise à jour' });
  } catch (err) {
    console.error('Erreur updateSessionStatut :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/sessions/attente — sessions en attente d'acceptation pour l'utilisateur (élève)
const getSessionsPendantes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*,
             d.titre AS demande_titre, d.description AS demande_desc, d.urgence,
             m.nom AS matiere,
             u_tuteur.id AS tuteur_id, u_tuteur.nom AS tuteur_nom, u_tuteur.prenom AS tuteur_prenom,
             pt.note_moyenne
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u_tuteur ON u_tuteur.id = s.tuteur_id
      LEFT JOIN profils_tuteurs pt ON pt.utilisateur_id = u_tuteur.id
      WHERE d.eleve_id = ? AND s.statut = 'proposee'
      ORDER BY s.date_proposition DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Erreur getSessionsPendantes :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/sessions/attente/:id/accepter — accepter une session proposée
const acceptSession = async (req, res) => {
  try {
    const [session] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ? AND s.statut = 'proposee'
    `, [req.params.id]);

    if (session.length === 0) {
      return res.status(404).json({ message: 'Session introuvable ou pas en statut proposée' });
    }

    if (session[0].eleve_id !== req.user.id) {
      return res.status(403).json({ message: 'Seul l\'élève peut accepter' });
    }

    await db.query(
      'UPDATE sessions_aide SET statut = "acceptee", date_debut = NOW() WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Session acceptée' });
  } catch (err) {
    console.error('Erreur acceptSession :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/sessions/attente/:id/refuser — refuser une session proposée
const refuseSession = async (req, res) => {
  try {
    const [session] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ? AND s.statut = 'proposee'
    `, [req.params.id]);

    if (session.length === 0) {
      return res.status(404).json({ message: 'Session introuvable ou pas en statut proposée' });
    }

    if (session[0].eleve_id !== req.user.id) {
      return res.status(403).json({ message: 'Seul l\'élève peut refuser' });
    }

    await db.query(
      'UPDATE sessions_aide SET statut = "refusee" WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Session refusée' });
  } catch (err) {
    console.error('Erreur refuseSession :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/sessions/:id/terminer — terminer une session (tuteur seulement)
const terminerSession = async (req, res) => {
  try {
    const [session] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ? AND s.statut = 'en_cours'
    `, [req.params.id]);

    if (session.length === 0) {
      return res.status(404).json({ message: 'Session introuvable ou pas en cours' });
    }

    if (session[0].tuteur_id !== req.user.id) {
      return res.status(403).json({ message: 'Seul le tuteur peut terminer' });
    }

    await db.query(
      'UPDATE sessions_aide SET statut = "terminee", date_fin = NOW() WHERE id = ?',
      [req.params.id]
    );

    // Incrémenter nb_sessions du tuteur
    await db.query(`
      UPDATE profils_tuteurs SET nb_sessions = nb_sessions + 1
      WHERE utilisateur_id = ?
    `, [req.user.id]);

    // Créer notification pour l'élève
    await db.query(
      'INSERT INTO notifications (utilisateur_id, type, message, lien) VALUES (?,?,?,?)',
      [session[0].eleve_id, 'session_terminee', 'Une session a été terminée, tu peux maintenant l\'évaluer', `/sessions/${req.params.id}`]
    );

    res.json({ message: 'Session terminée' });
  } catch (err) {
    console.error('Erreur terminerSession :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { proposerAide, getMesSessions, updateSessionStatut, getSessionsPendantes, acceptSession, refuseSession, terminerSession };