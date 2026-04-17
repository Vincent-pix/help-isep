# 📝 Notes d'Implémentation

## ⚠️ Important

### Fichier à Ignorer
- `backend/routes/demande.routes.js` - **NE PAS UTILISER**
  - Ce fichier a été créé par erreur pendant l'implémentation
  - Le fichier `demandes.routes.js` est celui-ci qui doit être utilisé (déjà en place)
  - Il utilise les contrôleurs sophistiqués dans `backend/controllers/demandes.controller.js`

### Fichiers Actifs
- ✅ `backend/routes/demandes.routes.js` - **À UTILISER** 
- ✅ `backend/routes/matiere.routes.js`
- ✅ `backend/routes/tuteur.routes.js`
- ✅ `backend/routes/session.routes.js`
- ✅ `backend/routes/message.routes.js`
- ✅ `backend/routes/evaluation.routes.js`

---

## 🔄 Flux Utilisateur

### 1. **Inscription / Connexion**
```
User → Register.jsx → POST /auth/register
User → Login.jsx → POST /auth/login → Token stocké
```

### 2. **Demandes d'Aide**
```
Dashboard → DemandesScreen
- GET /api/demandes → Affiche liste
- POST /api/demandes → Créer demande
- POST /api/sessions → Proposer aide
```

### 3. **Tuteurs**
```
Dashboard → TuteursScreen
- GET /api/tuteurs → Affiche tuteurs disponibles
- GET /api/tuteurs/mon-profil → Voir son profil tuteur
- POST /api/tuteurs/devenir-tuteur → Devenir tuteur
```

### 4. **Messages**
```
Dashboard → MessagesScreen
- GET /api/sessions/mes-sessions → Lister conversations
- GET /api/messages/:session_id → Charger historique
- POST /api/messages → Envoyer message
```

### 5. **Évaluations**
```
Dashboard → EvaluationsScreen
- GET /api/evaluations/mes-evals → Affiche évaluations
- POST /api/evaluations → Créer évaluation
```

---

## 🗄️ Base de Données

### Vues Utilisées
- `vue_demandes_ouvertes` - Demandes non assignées/en attente

### Tables Principales
- `utilisateurs` - Comptes
- `matieres` - Matières (Algo, Web, etc.)
- `demandes_aide` - Demandes
- `profils_tuteurs` - Info tuteurs
- `competences_tuteurs` - Compétences par tuteur
- `sessions_aide` - Mise en relation tuteur/élève
- `messages` - Conversation
- `evaluations` - Notes/commentaires

---

## 🔑 Variables d'Environnement Backend

Créer un fichier `.env` à la racine du backend :

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root (ou votre password)
DB_NAME=help_isep
PORT=3001
JWT_SECRET=votre_secret_jwt_ici
```

---

## 🎯 Tests Recommandés

### 1. Créer un utilisateur
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@isep.fr",
    "mot_de_passe": "password123"
  }'
```

### 2. Se connecter
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@isep.fr",
    "mot_de_passe": "password123"
  }'
```

### 3. Récupérer les matières
```bash
curl -X GET http://localhost:3001/api/matieres \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Frontend - Chemins d'Accès

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Connexion |
| Register | `/register` | Inscription |
| Dashboard | `/` | Page principale (protégée) |
| Demandes | Dashboard | Onglet demandes |
| Tuteurs | Dashboard | Onglet tuteurs |
| Messages | Dashboard | Onglet messages |
| Évaluations | Dashboard | Onglet évaluations |
| Profil | Dashboard | Onglet profil |

---

## 🚀 Stack Utilisé

### Backend
- **Node.js** + **Express** - Framework web
- **MySQL2/promise** - Pool de connexions MySQL
- **JWT** - Authentification
- **Bcrypt** - Hash mots de passe (via auth.controller)

### Frontend
- **React 18** - UI library
- **React Router 6** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling (pas de frameworks CSS)

---

## 📊 Statuts Demandes

```
ouverte → en_cours → resolue
       ↘ annulee ←↗
```

- **ouverte** : Demande publiée, en attente de tuteur
- **en_cours** : Un tuteur a proposé son aide
- **resolue** : Problème résolu
- **annulee** : Demande annulée

---

## 📊 Statuts Sessions

```
proposee → acceptee → en_cours → terminee
        ↘ refusee
```

---

## ✨ Fonctionnalités Bonus Possibles

1. **Notifications en temps réel** (Socket.io)
2. **Assistant Léa** (Chatbot IA)
3. **Système d'XP/Points** (Gamification)
4. **Badges et Achievements**
5. **Calendrier de disponibilités**
6. **Export PDF des demandes**
7. **Analytics/Dashboard Admin**
8. **Système de tarification pour tuteurs**

---

## 🐛 Débogage

### Log Backend
```bash
# Les logs s'affichent dans la console du serveur
console.log('Message') apparaît dans le terminal
```

### Log Frontend
```bash
# Utiliser les DevTools du navigateur
F12 → Console → Voir les logs React/API
```

### Vérifier la Base de Données
```bash
mysql -u root -p
use help_isep;
SELECT * FROM demandes_aide;
```

---

## ✅ Checklist Démarrage

- [ ] Node.js installé
- [ ] MySQL démarré
- [ ] `.env` configuré (backend)
- [ ] `npm install` dans backend ET frontend
- [ ] `npm start` backend → ✅ Port 3001
- [ ] `npm run dev` frontend → ✅ Port 5173
- [ ] Tester login → ✅ Redirect to dashboard

---

**Dernière mise à jour:** 17 avril 2026
