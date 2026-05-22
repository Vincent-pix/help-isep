const db = require('../config/db');

// ── MATIÈRES ──────────────────────────────────────────────

// GET /api/matieres
const getMatieres = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM matieres ORDER BY nom');
    res.json(rows);
  } catch (err) {
    console.error('Erreur getMatieres :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/matieres — admin seulement
const createMatiere = async (req, res) => {
  const { nom, description, couleur } = req.body;
  if (!nom) return res.status(400).json({ message: 'nom requis' });
  try {
    const [result] = await db.query(
      'INSERT INTO matieres (nom, description, couleur) VALUES (?,?,?)',
      [nom, description || null, couleur || '#3498db']
    );
    res.status(201).json({ message: 'Matière créée', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Cette matière existe déjà' });
    }
    console.error('Erreur createMatiere :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/matieres/proposer — utilisateur connecté
const proposerMatiere = async (req, res) => {
  const { nom, description, couleur } = req.body;
  if (!nom || !nom.trim()) {
    return res.status(400).json({ message: 'nom requis' });
  }
  const normalizedNom = nom.trim();
  try {
    const [existing] = await db.query('SELECT id, nom FROM matieres WHERE LOWER(nom) = LOWER(?) LIMIT 1', [normalizedNom]);
    if (existing.length > 0) {
      return res.json({ message: 'Matière déjà existante', id: existing[0].id, created: false });
    }
    const [result] = await db.query(
      'INSERT INTO matieres (nom, description, couleur) VALUES (?,?,?)',
      [normalizedNom, description || null, couleur || '#3498db']
    );
    res.status(201).json({ message: 'Matière ajoutée', id: result.insertId, created: true });
  } catch (err) {
    console.error('Erreur proposerMatiere :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── NOTIFICATIONS ─────────────────────────────────────────

// GET /api/notifications — notifications de l'utilisateur connecté
const getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE utilisateur_id = ? ORDER BY date_creation DESC LIMIT 30',
      [req.user.id]
    );
    const [count] = await db.query(
      'SELECT COUNT(*) AS non_lues FROM notifications WHERE utilisateur_id = ? AND lue = false',
      [req.user.id]
    );
    res.json({ notifications: rows, non_lues: count[0].non_lues });
  } catch (err) {
    console.error('Erreur getNotifications :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/notifications/lire — marquer tout comme lu
const marquerLues = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET lue = true WHERE utilisateur_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (err) {
    console.error('Erreur marquerLues :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMatieres, createMatiere, proposerMatiere, getNotifications, marquerLues };
