const db = require('./config/db');

// Script de migration pour ajouter les colonnes manquantes
async function migrate() {
  console.log('🔄 Migration de base de données...');

  try {
    // Ajouter colonne points_total à profils_tuteurs
    try {
      await db.query(`ALTER TABLE profils_tuteurs ADD COLUMN points_total INT NOT NULL DEFAULT 0`);
      console.log('✓ Colonne points_total ajoutée à profils_tuteurs');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Colonne points_total existe déjà');
      } else {
        throw err;
      }
    }

    // Ajouter colonne bio à utilisateurs si elle n'existe pas
    try {
      await db.query(`ALTER TABLE utilisateurs ADD COLUMN bio TEXT DEFAULT NULL`);
      console.log('✓ Colonne bio ajoutée à utilisateurs');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Colonne bio existe déjà');
      } else {
        throw err;
      }
    }

    // Ajouter colonne telephone à utilisateurs si elle n'existe pas
    try {
      await db.query(`ALTER TABLE utilisateurs ADD COLUMN telephone VARCHAR(20) DEFAULT NULL`);
      console.log('✓ Colonne telephone ajoutée à utilisateurs');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Colonne telephone existe déjà');
      } else {
        throw err;
      }
    }

    console.log('✅ Migration terminée!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur migration:', err.message);
    process.exit(1);
  }
}

migrate();
