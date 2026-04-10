# Help'ISEP 🎓

> Plateforme de mise en relation entre élèves en difficulté et élèves expérimentés  
> Bachelor ISEP B1 — Projet Développement Web

---

## 📋 Présentation

**Help'ISEP** est une application web permettant aux étudiants de l'ISEP de :
- **Poster des demandes d'aide** sur une matière spécifique
- **Proposer leur aide** en tant que tuteur sur les matières qu'ils maîtrisent
- **Communiquer** via un système de messagerie intégré
- **Évaluer** les sessions d'aide

---

## 👥 Équipe

| Membre | Rôle |
|--------|------|
| [Sarah] | Analyse du besoin |
| [Diya et Aminata] | Maquette |
| [Islamiath et Vincent] | Base de données |

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Front-end | React + CSS |
| Back-end | Node.js |
| Base de données | MySQL |
| Authentification | JWT + bcrypt |

---

## 📁 Structure du projet

```
help-isep/
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
│
├── backend/           # Serveur Node.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
│
├── database/
│   └── help_isep_database.sql   # Script de création BDD
│
└── README.md
```

---

## 🗄️ Base de données

### Tables principales
s
| Table | Description |
|-------|-------------|
| `utilisateurs` | Comptes élèves et admins |
| `matieres` | Matières disponibles |
| `profils_tuteurs` | Élèves proposant de l'aide |
| `competences_tuteurs` | Matières maîtrisées par les tuteurs |
| `demandes_aide` | Demandes postées par les élèves |
| `sessions_aide` | Mise en relation tuteur ↔ élève |
| `messages` | Messagerie des sessions |
| `evaluations` | Notes après session (1 à 5) |
| `notifications` | Alertes utilisateurs |

### Installer la base de données

**Prérequis** : MySQL 8+ installé et démarré

```bash
# 1. Se connecter à MySQL
mysql -u root -p

# 2. Importer le script
mysql -u root -p < database/help_isep_database.sql

# 3. Vérifier
mysql -u root -p -e "USE help_isep; SHOW TABLES;"
```

---

## 🚀 Lancer le projet

### Back-end

```bash
cd backend
npm install
cp .env.example .env   # renseigner les variables
npm run dev
```

Variables `.env` nécessaires :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mdp
DB_NAME=help_isep
JWT_SECRET=votre_secret_jwt
PORT=3001
```

### Front-end

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`

---

## 🔐 Sécurité

- Mots de passe hashés avec **bcrypt**
- Authentification par **JWT**
- Protection contre les injections **SQL** (requêtes préparées)
- Protection **XSS** (sanitisation des entrées)
- Gestion des rôles : `eleve` / `admin`

---

## 👤 Comptes de test

| Email | Rôle | Description |
|-------|------|-------------|
| `admin@isep.fr` | Admin | Accès complet |
| `alice.dupont@isep.fr` | Élève | Élève cherchant de l'aide |
| `bob.martin@isep.fr` | Élève + Tuteur | Tuteur en algo & dev web |

> ⚠️ Les mots de passe de test sont à définir après import du script SQL.

---

## 📐 Fonctionnalités

### Utilisateur standard
- [x] Inscription / Connexion
- [x] Poster une demande d'aide
- [x] Devenir tuteur (activer son profil)
- [x] Répondre à une demande
- [x] Messagerie en session
- [x] Évaluer une session

### Administrateur
- [x] Gérer les utilisateurs
- [x] Gérer les matières
- [x] Superviser les sessions

---

