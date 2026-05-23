const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importDatabase() {
  let connection;

  try {
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, '..', 'database', 'help_isep_database.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Obtenir la configuration de connexion
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.MYSQL_URL ||
      process.env.MYSQL_PUBLIC_URL;

    const connectionConfig = databaseUrl || {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'railway', // Utilise toujours la base railway
      waitForConnections: true,
      connectionLimit: 1,
    };

    console.log('Connexion à la base de données...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('✓ Connecté avec succès');

    // Diviser le fichier SQL en requêtes individuelles
    let queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q && !q.startsWith('--'))
      .map(q => q + ';');

    // Filtrer les commandes CREATE DATABASE et USE (on les ignore)
    queries = queries.filter(q => 
      !q.toUpperCase().includes('CREATE DATABASE') &&
      !q.toUpperCase().includes('USE ')
    );

    console.log(`\n${queries.length} requêtes SQL à exécuter...\n`);

    // Exécuter chaque requête
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        await connection.query(query);
        successCount++;
        console.log(`✓ [${i + 1}/${queries.length}] Requête exécutée`);
      } catch (err) {
        // Certaines erreurs sont attendues (ex: "database already exists")
        if (
          err.code === 'ER_DB_CREATE_EXISTS' ||
          err.code === 'ER_TABLE_EXISTS_ERROR'
        ) {
          console.log(`⚠ [${i + 1}/${queries.length}] Table existe déjà (ignoré)`);
          successCount++;
        } else {
          console.error(
            `✗ [${i + 1}/${queries.length}] Erreur:`,
            err.message
          );
          errorCount++;
          // Continuer quand même avec les autres requêtes
        }
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Résultat: ${successCount} réussi(e)s, ${errorCount} erreur(s)`);
    console.log(`${'='.repeat(50)}`);

    if (errorCount === 0) {
      console.log('\n✓✓✓ Base de données importée avec succès! ✓✓✓');
      process.exit(0);
    } else {
      console.log(`\n⚠ Importation terminée avec ${errorCount} erreur(s)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('✗ Erreur fatale:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importDatabase();
