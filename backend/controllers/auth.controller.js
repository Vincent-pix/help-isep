const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ─── INSCRIPTION ────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { nom, prenom, email, mot_de_passe } = req.body;

  // Validation des champs
  if (!nom || !prenom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }

  try {
    // Vérifier si l'email existe déjà
    const [existing] = await db.query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 10);

    // Insérer l'utilisateur
    const [result] = await db.query(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)',
      [nom, prenom, email, hash]
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      userId: result.insertId,
    });

  } catch (err) {
    console.error('Erreur register :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── CONNEXION ───────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    // Récupérer l'utilisateur
    const [rows] = await db.query(
      'SELECT * FROM utilisateurs WHERE email = ? AND actif = true',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];

    // Vérifier le mot de passe
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour la dernière connexion
    await db.query(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
      [user.id]
    );

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id:     user.id,
        nom:    user.nom,
        prenom: user.prenom,
        email:  user.email,
        role:   user.role,
      },
    });

  } catch (err) {
    console.error('Erreur login :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─── PROFIL (route protégée) ──────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nom, prenom, email, role, photo_profil, bio FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur getMe :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/auth/profile — profil complet avec stats
const getProfile = async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, nom, prenom, email, role, photo_profil, bio, telephone, date_inscription FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );
    if (user.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Si tuteur, récupérer les stats
    let tutorStats = null;
    let points_total = 0;
    let note_moyenne = null;
    let sessions_count = 0;

    const [tutorProfile] = await db.query(
      'SELECT points_total, note_moyenne FROM profils_tuteurs WHERE utilisateur_id = ?',
      [req.user.id]
    );
    if (tutorProfile.length > 0) {
      points_total = tutorProfile[0].points_total || 0;
      note_moyenne = tutorProfile[0].note_moyenne || 0;
      
      // Compter les sessions terminées
      const [sessionCount] = await db.query(
        'SELECT COUNT(*) as total FROM sessions_aide WHERE tuteur_id = ? AND statut = "terminee"',
        [req.user.id]
      );
      sessions_count = sessionCount[0]?.total || 0;
    }

    res.json({
      ...user[0],
      points_total,
      note_moyenne: note_moyenne ? parseFloat(note_moyenne).toFixed(1) : 0,
      sessions_count,
      certificatUnlocked: (note_moyenne || 0) >= 4.5 && sessions_count >= 5
    });
  } catch (err) {
    console.error('Erreur getProfile :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/auth/profile — mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const { nom, prenom, email, bio, telephone } = req.body;

    // Vérifier si l'email est déjà utilisé par quelqu'un d'autre
    if (email && email !== req.body.currentEmail) {
      const [existing] = await db.query(
        'SELECT id FROM utilisateurs WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    // Mettre à jour l'utilisateur
    await db.query(
      'UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?, bio = ?, telephone = ? WHERE id = ?',
      [nom, prenom, email, bio || null, telephone || null, req.user.id]
    );

    // Récupérer le profil mis à jour
    const [user] = await db.query(
      'SELECT id, nom, prenom, email, role, photo_profil, bio, telephone FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profil mis à jour',
      user: user[0]
    });
  } catch (err) {
    console.error('Erreur updateProfile :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { register, login, getMe, getProfile, updateProfile };