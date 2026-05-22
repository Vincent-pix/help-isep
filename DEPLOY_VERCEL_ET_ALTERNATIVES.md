# Déployer Help'ISEP avec Vercel (et alternatives)

Comme avec IONOS Deploy Now, l’idée est la même : **le frontend React** et **l’API Node.js + MySQL** ne vont pas forcément sur la même plateforme.

---

## Rappel architecture

| Composant | Techno | Où l’héberger |
|-----------|--------|----------------|
| Frontend | React + Vite | Vercel, Netlify, Cloudflare Pages, IONOS Deploy Now |
| API | Express (Node) | Render, Railway, Fly.io, VPS IONOS |
| Base de données | MySQL | PlanetScale, Railway, Aiven, MySQL sur VPS |

---

## Option 1 — Vercel (frontend) + Render (API) — recommandé pour démarrer

### Frontend sur Vercel

1. Compte sur [vercel.com](https://vercel.com) → **Add New Project** → importer le repo GitHub.
2. Paramètres du projet :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
3. **Environment Variables** (Production) :
   - `VITE_API_URL` = `https://ton-api.onrender.com/api` (URL de ton backend)
4. Deploy.

Le fichier `frontend/vercel.json` gère le routing SPA (`/app`, etc.).

### API sur Render

1. [render.com](https://render.com) → **New Web Service** → repo GitHub.
2. **Root Directory** : `backend`
3. **Build Command** : `npm install`
4. **Start Command** : `npm start`
5. Variables d’environnement :
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=...
   DB_USER=...
   DB_PASSWORD=...
   DB_NAME=help_isep
   JWT_SECRET=...
   CORS_ORIGINS=https://ton-projet.vercel.app,https://www.ton-domaine.fr
   SERVE_FRONTEND=false
   ```
6. Base MySQL : Render PostgreSQL **ou** MySQL externe (PlanetScale, Railway, VPS).

> Render free : le service peut s’endormir après inactivité (réveil lent au 1er appel).

---

## Option 2 — Netlify (frontend) + Railway (API + MySQL)

Très proche de Vercel + Render.

**Netlify** (dossier `frontend`) :

- Build : `npm run build`
- Publish : `dist`
- Fichier `frontend/public/_redirects` (optionnel) :
  ```
  /*    /index.html   200
  ```
- Env : `VITE_API_URL`

**Railway** : un service pour `backend/`, un plugin **MySQL** sur le même projet → variables `DB_*` injectées automatiquement.

---

## Option 3 — Cloudflare Pages (frontend) + VPS / Railway (API)

- Front gratuit, rapide, bon CDN.
- Build : `frontend`, commande `npm run build`, output `dist`.
- Variable `VITE_API_URL` dans les paramètres Pages.

---

## Option 4 — Tout sur un VPS (IONOS ou autre)

Un seul serveur : front + API + MySQL.  
Voir [DEPLOY_IONOS.md](./DEPLOY_IONOS.md) (`SERVE_FRONTEND=true`, `VITE_API_URL=/api`).

---

## Option 5 — Railway ou Render (monorepo)

Possible de déployer **deux services** depuis le même repo :

| Service | Dossier | Commande |
|---------|---------|----------|
| Web (API) | `backend` | `npm start` |
| Static / autre | `frontend` | build + servir via CDN séparé |

MySQL géré sur Railway simplifie beaucoup la config BDD.

---

## Comparaison rapide

| Plateforme | Frontend | API Node longue durée | MySQL managé | Gratuit | Facilité |
|------------|----------|------------------------|--------------|---------|----------|
| **Vercel** | ⭐⭐⭐ | ❌ (serverless only*) | ❌ | Oui | ⭐⭐⭐ |
| **Netlify** | ⭐⭐⭐ | ❌ (functions) | ❌ | Oui | ⭐⭐⭐ |
| **Render** | ⭐⭐ | ⭐⭐ | ⭐ (PG) | Limité | ⭐⭐ |
| **Railway** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Crédits | ⭐⭐⭐ |
| **IONOS Deploy Now** | ⭐⭐ | ❌ | ❌ (PHP) | Selon offre | ⭐⭐ |
| **VPS IONOS** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Non | ⭐ |

\* Adapter Express en fonctions serverless est possible mais **non recommandé** pour ce projet tel quel.

---

## Configuration déjà prête dans le projet

- `VITE_API_URL` dans `frontend/.env.example`
- CORS via `CORS_ORIGINS` dans `backend/.env.example`
- `frontend/vercel.json` pour Vercel
- `frontend/public/.htaccess` pour Apache (IONOS)

---

## Exemple de flux complet (Vercel + Render)

1. Déployer l’API sur Render → noter l’URL `https://help-isep-api.onrender.com`
2. Créer la BDD MySQL et importer `database/help_isep_database.sql`
3. `CORS_ORIGINS` = URL Vercel du front
4. Déployer le front sur Vercel avec `VITE_API_URL=https://help-isep-api.onrender.com/api`
5. Tester login + demandes + messages

---

## Quelle combinaison choisir ?

| Profil | Choix |
|--------|--------|
| Projet scolaire, simple, gratuit | **Vercel + Render** |
| BDD MySQL simple sans admin serveur | **Vercel + Railway** (MySQL inclus) |
| Tout chez IONOS, un seul fournisseur | **Deploy Now (front) + VPS (API)** |
| Contrôle total | **VPS** seul |

**Guide détaillé Vercel + Railway** : [DEPLOY_VERCEL_RAILWAY.md](./DEPLOY_VERCEL_RAILWAY.md)  
Fichiers inclus : `frontend/vercel.json`, `backend/railway.toml`, support `MYSQL_URL` dans `backend/config/db.js`.
