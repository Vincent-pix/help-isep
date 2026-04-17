const express = require('express');
const cors = require('cors');
require('dotenv').config();
 
const authRoutes = require('./routes/auth.routes');
const demandesRoutes = require('./routes/demandes.routes');
 
const app = express();
 
// Middlewares
app.use(cors());
app.use(express.json());
 
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandesRoutes);
 
// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Help\'ISEP opérationnelle' });
});
 
// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
 