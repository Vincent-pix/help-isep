const db = require('../config/db');

// Statuts autorisés (correspond à l'ENUM SQL)
const STATUTS_VALIDES = ['ouverte', 'en_cours', 'resolue', 'annulee'];

// Transitions autorisées : qui peut passer à quel statut
const TRANSITIONS = {
  ouverte:   ['en_cours', 'annulee'],
  en_cours:  ['resolue', 'annulee'],
  resolue:   [],
  annulee:   [],
};

// ─────────────────────────────────────────
// GET /api/demandes
// Liste toutes les demandes ouvertes
// ─────────────────────────────────────────
const getDemandesOuvertes = async (req, res) => {
  try {
    // Filtres optionnels : ?matiere_id=2 & urgence=haute
    const { matiere_id, urgence } = req.query;

    let query = `SELECT * FROM vue_demandes_ouvertes WHERE 1=1`;
    const params = [];

    if (matiere_id) {
      query += ` AND matiere_id = ?`;
      params.push(matiere_id);
    }
    if (urgence) {
      query += ` AND urgence = ?`;
      params.push(urgence);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('[getDemandesOuvertes]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// POST /api/demandes
// Créer une nouvelle demande d'aide
// ─────────────────────────────────────────
const createDemande = async (req, res) => {
  try {
    const { matiere_id, titre, description, urgence } = req.body;
    const eleve_id = req.user.id; // injecté par authMiddleware

    // Validation basique
    if (!matiere_id || !titre || !description) {
      return res.status(400).json({
        success: false,
        message: 'Les champs matiere_id, titre et description sont obligatoires',
      });
    }

    // Vérifier que la matière existe
    const [matieres] = await db.query(
      'SELECT id FROM matieres WHERE id = ?',
      [matiere_id]
    );
    if (matieres.length === 0) {
      return res.status(404).json({ success: false, message: 'Matière introuvable' });
    }

    const [result] = await db.query(
      `INSERT INTO demandes_aide (eleve_id, matiere_id, titre, description, urgence)
       VALUES (?, ?, ?, ?, ?)`,
      [eleve_id, matiere_id, titre, description, urgence || 'normale']
    );

    // Retourner la demande créée complète
    const [demande] = await db.query(
      `SELECT d.*, m.nom AS matiere, m.couleur
       FROM demandes_aide d
       JOIN matieres m ON m.id = d.matiere_id
       WHERE d.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: demande[0] });
  } catch (error) {
    console.error('[createDemande]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// GET /api/demandes/:id
// Détail complet d'une demande
// ─────────────────────────────────────────
const getDemandeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
         d.*,
         m.nom        AS matiere,
         m.couleur    AS matiere_couleur,
         u.nom        AS eleve_nom,
         u.prenom     AS eleve_prenom,
         u.photo_profil AS eleve_photo,
         -- Session associée si elle existe
         s.id         AS session_id,
         s.statut     AS session_statut,
         s.tuteur_id,
         CONCAT(t.prenom, ' ', t.nom) AS tuteur_nom
       FROM demandes_aide d
       JOIN matieres m       ON m.id = d.matiere_id
       JOIN utilisateurs u   ON u.id = d.eleve_id
       LEFT JOIN sessions_aide s ON s.demande_id = d.id
                                AND s.statut NOT IN ('refusee')
       LEFT JOIN utilisateurs t  ON t.id = s.tuteur_id
       WHERE d.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande introuvable' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[getDemandeById]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// PATCH /api/demandes/:id/statut
// Changer le statut d'une demande
// ─────────────────────────────────────────
const updateStatutDemande = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Valider le statut cible
    if (!STATUTS_VALIDES.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}`,
      });
    }

    // Récupérer la demande actuelle
    const [rows] = await db.query(
      'SELECT * FROM demandes_aide WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demande introuvable' });
    }

    const demande = rows[0];

    // Seul l'élève propriétaire ou un admin peut modifier
    if (userRole !== 'admin' && demande.eleve_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Action non autorisée',
      });
    }

    // Vérifier la transition est autorisée
    const transitionsAutorisees = TRANSITIONS[demande.statut];
    if (!transitionsAutorisees.includes(statut)) {
      return res.status(422).json({
        success: false,
        message: `Transition impossible : ${demande.statut} → ${statut}`,
      });
    }

    // Mettre à jour (+ date_resolution si resolue)
    await db.query(
      `UPDATE demandes_aide
       SET statut = ?,
           date_resolution = IF(? = 'resolue', NOW(), date_resolution)
       WHERE id = ?`,
      [statut, statut, id]
    );

    res.json({
      success: true,
      message: `Statut mis à jour : ${demande.statut} → ${statut}`,
      data: { id: parseInt(id), ancien_statut: demande.statut, nouveau_statut: statut },
    });
  } catch (error) {
    console.error('[updateStatutDemande]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getDemandesOuvertes,
  createDemande,
  getDemandeById,
  updateStatutDemande,
};
