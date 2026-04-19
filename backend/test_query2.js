const db = require('./config/db');

(async () => {
  try {
    console.log('=== TEST NOUVELLE REQUÊTE TUTEURS ===');
    
    // Récupérer tous les tuteurs disponibles
    let tuteurQuery = `
      SELECT DISTINCT u.id, u.nom, u.prenom, u.photo_profil, u.bio,
             pt.note_moyenne, pt.nb_sessions, pt.disponible
      FROM utilisateurs u
      JOIN profils_tuteurs pt ON pt.utilisateur_id = u.id
      WHERE u.actif = true AND pt.disponible = true
      ORDER BY COALESCE(pt.note_moyenne, 0) DESC
    `;
    const tuteurParams = [];
    
    console.log('Query:', tuteurQuery);
    const [tuteurs] = await db.query(tuteurQuery, tuteurParams);
    console.log('✓ Tuteurs trouvés:', tuteurs.length);
    
    // Pour chaque tuteur, récupérer ses compétences
    const result = [];
    for (const tuteur of tuteurs) {
      console.log(`  - Récupération matieres pour tuteur ${tuteur.id}...`);
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
    
    console.log('\n✓ Résultat final:', result.length, 'tuteurs');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('✗ Erreur SQL:', err.message);
    console.error(err.stack);
  }
  process.exit(0);
})();
