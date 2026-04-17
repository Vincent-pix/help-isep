const express = require('express');
const cors = require('cors');
require('dotenv').config();
 
const authRoutes = require('./routes/auth.routes');
const demandesRoutes = require('./routes/demandes.routes');
const matiereRoutes = require('./routes/matiere.routes');
const tuteurRoutes = require('./routes/tuteur.routes');
const sessionRoutes = require('./routes/session.routes');
const messageRoutes = require('./routes/message.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
 
const app = express();
 
// Middlewares
app.use(cors());
app.use(express.json());
 
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/tuteurs', tuteurRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/evaluations', evaluationRoutes);
 
// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Help\'ISEP opérationnelle' });
});
 
// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
 