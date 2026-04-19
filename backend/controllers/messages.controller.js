const db = require('../config/db');

// GET /api/messages/:sessionId — messages d'une session
const getMessages = async (req, res) => {
  try {
    // Vérifier que l'utilisateur fait partie de la session
    const [session] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ?
    `, [req.params.sessionId]);

    if (session.length === 0) return res.status(404).json({ message: 'Session introuvable' });

    const s = session[0];
    if (s.eleve_id !== req.user.id && s.tuteur_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const [messages] = await db.query(`
      SELECT msg.*, u.nom, u.prenom
      FROM messages msg
      JOIN utilisateurs u ON u.id = msg.expediteur_id
      WHERE msg.session_id = ?
      ORDER BY msg.date_envoi ASC
    `, [req.params.sessionId]);

    // Marquer les messages comme lus
    await db.query(
      'UPDATE messages SET lu = true WHERE session_id = ? AND expediteur_id != ?',
      [req.params.sessionId, req.user.id]
    );

    res.json(messages);
  } catch (err) {
    console.error('Erreur getMessages :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/messages/:sessionId — envoyer un message
const sendMessage = async (req, res) => {
  const { contenu } = req.body;
  if (!contenu || !contenu.trim()) {
    return res.status(400).json({ message: 'Le message ne peut pas être vide' });
  }
  try {
    // Vérifier que l'utilisateur fait partie de la session
    const [session] = await db.query(`
      SELECT s.*, d.eleve_id
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      WHERE s.id = ?
    `, [req.params.sessionId]);

    if (session.length === 0) return res.status(404).json({ message: 'Session introuvable' });

    const s = session[0];
    if (s.eleve_id !== req.user.id && s.tuteur_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (session_id, expediteur_id, contenu) VALUES (?,?,?)',
      [req.params.sessionId, req.user.id, contenu.trim()]
    );

    // Notifier le destinataire
    const destinataire = s.eleve_id === req.user.id ? s.tuteur_id : s.eleve_id;
    await db.query(
      'INSERT INTO notifications (utilisateur_id, type, message, lien) VALUES (?,?,?,?)',
      [destinataire, 'nouveau_message', 'Vous avez un nouveau message', `/sessions/${req.params.sessionId}`]
    );

    res.status(201).json({ message: 'Message envoyé', id: result.insertId });
  } catch (err) {
    console.error('Erreur sendMessage :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/messages/conversations — liste des conversations
const getConversations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id AS session_id,
        d.titre AS demande_titre,
        m.nom AS matiere,
        u_autre.id AS interlocuteur_id,
        u_autre.nom AS interlocuteur_nom,
        u_autre.prenom AS interlocuteur_prenom,
        (SELECT contenu FROM messages WHERE session_id = s.id ORDER BY date_envoi DESC LIMIT 1) AS dernier_message,
        (SELECT date_envoi FROM messages WHERE session_id = s.id ORDER BY date_envoi DESC LIMIT 1) AS derniere_date,
        (SELECT COUNT(*) FROM messages WHERE session_id = s.id AND lu = false AND expediteur_id != ?) AS non_lus
      FROM sessions_aide s
      JOIN demandes_aide d ON d.id = s.demande_id
      JOIN matieres m ON m.id = d.matiere_id
      JOIN utilisateurs u_autre ON u_autre.id = IF(d.eleve_id = ?, s.tuteur_id, d.eleve_id)
      WHERE d.eleve_id = ? OR s.tuteur_id = ?
      ORDER BY derniere_date DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error('Erreur getConversations :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMessages, sendMessage, getConversations };