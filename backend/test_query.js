const db = require('./config/db');

(async () => {
  try {
    const query = `
      SELECT u.id, u.nom, u.prenom, u.photo_profil, u.bio,
             pt.note_moyenne, pt.nb_sessions, pt.disponible,
             GROUP_CONCAT(DISTINCT m.nom ORDER BY m.nom SEPARATOR ',') AS matieres,
             GROUP_CONCAT(DISTINCT m.id ORDER BY m.nom SEPARATOR ',') AS matiere_ids
      FROM utilisateurs u
      JOIN profils_tuteurs pt ON pt.utilisateur_id = u.id
      LEFT JOIN competences_tuteurs ct ON ct.tuteur_id = pt.id
      LEFT JOIN matieres m ON m.id = ct.matiere_id
      WHERE u.actif = true AND pt.disponible = true
      GROUP BY u.id, pt.id
      ORDER BY ISNULL(pt.note_moyenne), pt.note_moyenne DESC
    `;
    const [rows] = await db.query(query, []);
    console.log('Résultat:', rows.length, 'tuteurs');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Erreur SQL:', err.message);
    console.error('Détails:', err);
  }
  process.exit(0);
})();

