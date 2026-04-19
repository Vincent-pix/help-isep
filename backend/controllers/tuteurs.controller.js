const db = require('../config/db');

// GET /api/tuteurs — liste des tuteurs disponibles
const getAllTuteurs = async (req, res) => {
  try {
    const { matiere_id } = req.query;
    
    // Récupérer tous les tuteurs disponibles
    let tuteurQuery = `
      SELECT DISTINCT u.id, u.nom, u.prenom, u.photo_profil, u.bio,
             pt.note_moyenne, pt.nb_sessions, pt.disponible
      FROM utilisateurs u
      JOIN profils_tuteurs pt ON pt.utilisateur_id = u.id
      WHERE u.actif = true AND pt.disponible = true
    `;
    const tuteurParams = [];
    
    if (matiere_id) {
      tuteurQuery += `
        AND pt.id IN (
          SELECT ct.tuteur_id FROM competences_tuteurs ct
          WHERE ct.matiere_id = ?
        )
      `;
      tuteurParams.push(matiere_id);
    }
    
    tuteurQuery += ' ORDER BY COALESCE(pt.note_moyenne, 0) DESC';
    
    const [tuteurs] = await db.query(tuteurQuery, tuteurParams);
    
    // Pour chaque tuteur, récupérer ses compétences
    const result = [];
    for (const tuteur of tuteurs) {
      const [matieres] = await db.query(`
        SELECT m.id, m.nom 
        FROM matieres m
        JOIN competences_tuteurs ct ON ct.matiere_id = m.id
        WHERE ct.tuteur_id = (SELECT id FROM profils_tuteurs WHERE utilisateur_id = ?)
      `, [tuteur.id]);
      
      result.push({
        ...tuteur,
        matieres: matieres.map(m => m.nom).join(','),
        matiere_ids: matieres.map(m => m.id).join(',')
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Erreur getTuteurs :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/tuteurs/:id
const getMonProfil = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nom, u.prenom, u.photo_profil, u.bio,
             pt.note_moyenne, pt.nb_sessions, pt.disponible
      FROM utilisateurs u
      JOIN profils_tuteurs pt ON pt.utilisateur_id = u.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Tuteur introuvable' });

    // Récupérer ses compétences
    const [competences] = await db.query(`
      SELECT m.id, m.nom, m.couleur, ct.niveau
      FROM competences_tuteurs ct
      JOIN matieres m ON m.id = ct.matiere_id
      JOIN profils_tuteurs pt ON pt.id = ct.tuteur_id
      WHERE pt.utilisateur_id = ?
    `, [req.params.id]);

    res.json({ ...rows[0], competences });
  } catch (err) {
    console.error('Erreur getTuteurById :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/tuteurs — devenir tuteur
const devenirTuteur = async (req, res) => {
  const { competences } = req.body; // [{ matiere_id, niveau }]
  if (!competences || competences.length === 0) {
    return res.status(400).json({ message: 'Au moins une compétence requise' });
  }
  try {
    // Vérifier si profil tuteur existe déjà
    const [existing] = await db.query(
      'SELECT id FROM profils_tuteurs WHERE utilisateur_id = ?',
      [req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Profil tuteur déjà existant' });
    }

    // Créer le profil tuteur
    const [result] = await db.query(
      'INSERT INTO profils_tuteurs (utilisateur_id, disponible) VALUES (?, true)',
      [req.user.id]
    );
    const tuteurId = result.insertId;

    // Insérer les compétences
    for (const c of competences) {
      await db.query(
        'INSERT INTO competences_tuteurs (tuteur_id, matiere_id, niveau) VALUES (?,?,?)',
        [tuteurId, c.matiere_id, c.niveau || 'intermédiaire']
      );
    }

    res.status(201).json({ message: 'Profil tuteur créé', tuteurId });
  } catch (err) {
    console.error('Erreur devenirTuteur :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/tuteurs/disponibilite
const updateDisponibilite = async (req, res) => {
  const { disponible } = req.body;
  try {
    // Vérifier que le profil tuteur existe
    const [existing] = await db.query(
      'SELECT id FROM profils_tuteurs WHERE utilisateur_id = ?',
      [req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Profil tuteur non trouvé' });
    }
    
    await db.query(
      'UPDATE profils_tuteurs SET disponible = ? WHERE utilisateur_id = ?',
      [disponible, req.user.id]
    );
    res.json({ message: 'Disponibilité mise à jour' });
  } catch (err) {
    console.error('Erreur updateDisponibilite :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAllTuteurs, getMonProfil, devenirTuteur, updateDisponibilite };