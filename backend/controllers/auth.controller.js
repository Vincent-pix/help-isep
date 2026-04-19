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
      'SELECT id, nom, prenom, email, role, photo_profil, bio, date_inscription FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );
    if (user.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Si tuteur, récupérer les stats
    let tutorStats = null;
    const [tutorProfile] = await db.query(
      'SELECT * FROM profils_tuteurs WHERE utilisateur_id = ?',
      [req.user.id]
    );
    if (tutorProfile.length > 0) {
      tutorStats = tutorProfile[0];
      // Récupérer les compétences
      const [competences] = await db.query(`
        SELECT m.id, m.nom, ct.niveau
        FROM competences_tuteurs ct
        JOIN matieres m ON m.id = ct.matiere_id
        WHERE ct.tuteur_id = ?
        ORDER BY m.nom
      `, [tutorProfile[0].id]);
      tutorStats.competences = competences;
    }

    // Compter les sessions
    const [sessions] = await db.query(
      'SELECT COUNT(*) as total FROM sessions_aide WHERE tuteur_id = ? AND statut = "terminee"',
      [req.user.id]
    );
    const sessionsCount = sessions[0]?.total || 0;
    const points = Math.min(sessionsCount * 50, 1000);

    // Moyenne des évaluations
    const [evals] = await db.query(`
      SELECT COUNT(*) as total, AVG(note) as moyenne
      FROM evaluations e
      JOIN sessions_aide s ON s.id = e.session_id
      WHERE s.tuteur_id = ?
    `, [req.user.id]);
    const avgRating = evals[0]?.moyenne || null;

    // Demandes de l'utilisateur
    const [demands] = await db.query(
      'SELECT COUNT(*) as total FROM demandes_aide WHERE eleve_id = ? AND statut != "annulee"',
      [req.user.id]
    );

    res.json({
      ...user[0],
      tutorStats,
      stats: {
        sessionsCompletees: sessionsCount,
        points,
        avgRating,
        demandesActives: demands[0]?.total || 0,
        certificatUnlocked: points >= 1000 && (avgRating || 0) >= 4.5
      }
    });
  } catch (err) {
    console.error('Erreur getProfile :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { register, login, getMe, getProfile };