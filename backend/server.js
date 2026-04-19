const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const apiRoutes  = require('./routes/api.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api',      apiRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: "API Help'ISEP opérationnelle ✅" });
});

// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée :', err);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});