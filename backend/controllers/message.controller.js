const db = require('../config/db');

// ─────────────────────────────────────────
// GET /api/messages/:sessionId
// Récupérer les messages d'une session
// ─────────────────────────────────────────
const getMessages = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [session] = await db.query(
      'SELECT s.* FROM sessions_aide s JOIN demandes_aide d ON d.id = s.demande_id WHERE s.id = ? AND (s.tuteur_id = ? OR d.eleve_id = ?)',
      [sessionId, req.user.id, req.user.id]
    );
    if (session.length === 0) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const [messages] = await db.query(
      'SELECT m.id, m.contenu, m.date_envoi, m.expediteur_id, u.nom, u.prenom FROM messages m JOIN utilisateurs u ON u.id = m.expediteur_id WHERE m.session_id = ? ORDER BY m.date_envoi ASC',
      [sessionId]
    );
    res.json(messages);
  } catch (error) {
    console.error('[getMessages]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// POST /api/messages/:sessionId
// Envoyer un message dans une session
// ─────────────────────────────────────────
const sendMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { contenu } = req.body;

  if (!contenu || !contenu.trim()) {
    return res.status(400).json({ message: 'Contenu requis' });
  }

  try {
    const [session] = await db.query(
      'SELECT s.* FROM sessions_aide s JOIN demandes_aide d ON d.id = s.demande_id WHERE s.id = ? AND (s.tuteur_id = ? OR d.eleve_id = ?)',
      [sessionId, req.user.id, req.user.id]
    );
    if (session.length === 0) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (session_id, expediteur_id, contenu, date_envoi) VALUES (?, ?, ?, NOW())',
      [sessionId, req.user.id, contenu.trim()]
    );

    res.status(201).json({ id: result.insertId, message: 'Message envoyé' });
  } catch (error) {
    console.error('[sendMessage]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMessages, sendMessage };