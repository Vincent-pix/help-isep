const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!isProduction) return callback(null, true);
    if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const serveFrontend = process.env.SERVE_FRONTEND === 'true' || process.env.SERVE_FRONTEND === '1';
const frontendDist = path.join(__dirname, '../frontend/dist');

if (serveFrontend) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api).*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: "API Help'ISEP opérationnelle ✅" });
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: "Help'ISEP API" });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origine non autorisée (CORS)' });
  }
  console.error('Erreur non gérée :', err);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT} (${isProduction ? 'production' : 'développement'})`);
  if (serveFrontend) {
    console.log(`Frontend servi depuis ${frontendDist}`);
  }
});
