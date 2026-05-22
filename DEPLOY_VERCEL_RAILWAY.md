# Déployer Help'ISEP — Vercel + Railway

Guide pas à pas pour héberger le **frontend sur Vercel** et l’**API + MySQL sur Railway**.

```text
Utilisateur → https://help-isep.vercel.app (frontend)
                    ↓ API
              https://help-isep-api.up.railway.app/api (backend)
                    ↓
              MySQL (service Railway)
```

---

## Prérequis

- Compte [GitHub](https://github.com) avec le code poussé
- Compte [Railway](https://railway.app) (connexion GitHub)
- Compte [Vercel](https://vercel.com) (connexion GitHub)

---

## Partie 1 — Railway (MySQL + API)

### 1.1 Créer le projet

1. [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → choisir `help-isep`
3. Railway crée un premier service (l’API).

### 1.2 Service API (backend)

1. Cliquer sur le service → **Settings**
2. **Root Directory** : `backend`
3. **Start Command** : `npm start` (déjà dans `package.json`)
4. **Networking** → **Generate Domain** → noter l’URL publique  
   Exemple : `https://help-isep-production.up.railway.app`

### 1.3 Ajouter MySQL

1. Dans le projet Railway → **+ New** → **Database** → **MySQL**
2. Une fois créé, ouvrir le service MySQL → **Variables** ou **Connect**
3. Dans le service **backend**, lier les variables MySQL :
   - **Variables** → **Add Reference** → sélectionner les variables du service MySQL  
   - Railway injecte en général `MYSQL_URL` ou `DATABASE_URL` (le code les gère déjà)

### 1.4 Variables d’environnement (service backend)

Dans **backend** → **Variables** :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | longue chaîne aléatoire (ex. `openssl rand -base64 48`) |
| `CORS_ORIGINS` | URL Vercel (à compléter après étape 2), ex. `https://help-isep.vercel.app` |
| `SERVE_FRONTEND` | `false` |

Les variables MySQL (`MYSQL_URL`, etc.) viennent de la **référence** au service MySQL — pas besoin de les taper à la main.

> `PORT` est défini automatiquement par Railway.

### 1.5 Importer le schéma SQL

**Option A — Railway CLI**

```bash
npm i -g @railway/cli
railway login
railway link
railway connect mysql
```

Puis dans le shell MySQL :

```sql
SOURCE database/help_isep_database.sql;
```

*(Adapter le chemin si besoin — ou copier-coller le contenu du fichier.)*

**Option B — Client GUI (TablePlus, DBeaver)**

1. MySQL service → **Connect** → copier host, port, user, password, database
2. Se connecter depuis le client
3. Exécuter `database/help_isep_database.sql`

### 1.6 Vérifier l’API

Ouvrir dans le navigateur :

```text
https://TON-DOMAINE-RAILWAY.up.railway.app/api/health
```

Réponse attendue : `{"status":"ok","service":"Help'ISEP API"}`

---

## Partie 2 — Vercel (frontend)

### 2.1 Créer le projet

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importer le repo `help-isep`
3. Paramètres :

| Champ | Valeur |
|-------|--------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 2.2 Variable d’environnement

**Settings** → **Environment Variables** → Production :

| Nom | Valeur |
|-----|--------|
| `VITE_API_URL` | `https://TON-DOMAINE-RAILWAY.up.railway.app/api` |

⚠️ Remplacer par **ton** domaine Railway (avec `/api` à la fin).

### 2.3 Déployer

**Deploy** → attendre la fin du build.

URL du front : `https://help-isep-xxx.vercel.app`

### 2.4 Finaliser CORS sur Railway

Retourner sur Railway → service **backend** → **Variables** :

```text
CORS_ORIGINS=https://help-isep-xxx.vercel.app
```

Ajouter aussi ton domaine custom si tu en configures un sur Vercel.

**Redeploy** le service backend (ou attendre le redémarrage auto).

---

## Partie 3 — Test complet

1. Ouvrir l’URL Vercel
2. Créer un compte / se connecter
3. Publier une demande, tester messages, validation, points
4. Si erreur **CORS** : vérifier `CORS_ORIGINS` (URL exacte, `https`, sans slash final)
5. Si **Network Error** : vérifier `VITE_API_URL` et redéployer Vercel après modification

---

## Mises à jour (CI/CD)

| Changement | Action |
|------------|--------|
| Code front | `git push` → Vercel rebuild auto |
| Code API | `git push` → Railway redeploy auto |
| Nouvelle variable front | Vercel → redeploy |
| Nouvelle variable API | Railway → redeploy |

---

## Fichiers utiles dans le repo

| Fichier | Rôle |
|---------|------|
| `frontend/vercel.json` | Routing SPA sur Vercel |
| `backend/railway.toml` | Config Railway (healthcheck, start) |
| `backend/config/db.js` | Support `MYSQL_URL` / `DATABASE_URL` Railway |
| `backend/.env.example` | Variables locales |
| `frontend/.env.example` | `VITE_API_URL` |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `Access denied` MySQL | Vérifier la référence des variables MySQL sur le service backend |
| API 502 sur Railway | Logs du service → `npm install` OK ? `JWT_SECRET` défini ? |
| Front appelle `localhost` | `VITE_API_URL` sur Vercel + **redeploy** |
| 403 CORS | `CORS_ORIGINS` = URL Vercel exacte |
| Page blanche sur `/app` | `frontend/vercel.json` présent, rebuild Vercel |
| Colonnes SQL manquantes | Ré-importer SQL ou laisser le démarrage backend exécuter l’`ALTER` auto |

---

## Coûts

- **Vercel** : gratuit pour projet perso / hobby (limites de bande passante)
- **Railway** : crédits gratuits puis facturation à l’usage — surveiller la conso dans le dashboard

---

## Domaine personnalisé (optionnel)

- **Vercel** : Settings → Domains → `www.ton-domaine.fr`
- **Railway** : Settings → Networking → Custom Domain → `api.ton-domaine.fr`
- Mettre à jour `VITE_API_URL` et `CORS_ORIGINS` en conséquence.
