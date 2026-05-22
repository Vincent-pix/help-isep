const mysql = require('mysql2/promise');
require('dotenv').config();

function getPoolConfig() {
  // Railway (et autres PaaS) injectent souvent une URL complète
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_PUBLIC_URL;

  if (databaseUrl) {
    return databaseUrl;
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  };
}

const pool = mysql.createPool(getPoolConfig());

pool.getConnection()
  .then((conn) => {
    console.log('Connecté à la base de données MySQL');
    return conn.query(`
      ALTER TABLE sessions_aide
      ADD COLUMN IF NOT EXISTS aide_validee_par_eleve BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS date_validation DATETIME DEFAULT NULL
    `).catch(() => {}).finally(() => {
      conn.release();
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion MySQL :', err.message);
  });

module.exports = pool;
