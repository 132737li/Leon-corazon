# API Berlly Boutique

Backend Node.js / Express / MongoDB de la boutique : comptes clients, profils (photo, e-mail non modifiable),
mot de passe oublié, commandes et espace administrateur.

## Ce que fait l'API

| Route | Accès | Rôle |
|---|---|---|
| `POST /api/auth/register` · `login` | public | Inscription / connexion (mots de passe hachés avec bcrypt) |
| `GET/PATCH /api/auth/me` | client | Voir / modifier son profil (nom, téléphone, photo). **L'e-mail est refusé s'il change.** |
| `POST /api/auth/forgot-password` · `reset-password` | public | Lien de réinitialisation à usage unique, valable 30 min |
| `POST /api/orders` | client | Passer une commande (le **total est recalculé par le serveur**) |
| `GET /api/orders/mine` | client | Mes commandes |
| `POST /api/admin/login` | public | Connexion admin (identifiants dans les variables d'environnement) |
| `GET /api/admin/orders` · `PATCH …/:id/status` · `DELETE …/:id` | admin | Toutes les commandes, statut, suppression |

## 1. Lancer en local

```bash
cd server
npm install
cp .env.example .env        # puis remplis .env (voir ci-dessous)
npm run dev                 # API sur http://localhost:5000
```

Dans `.env` :

1. **MONGODB_URI** : une base MongoDB. Le plus simple : un cluster gratuit sur https://www.mongodb.com/atlas
   (Database → Connect → Drivers → copie l'adresse, remplace `<password>`). Pense à autoriser ton IP dans *Network Access*.
2. **JWT_SECRET** : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
3. **ADMIN_USERNAME** + **ADMIN_PASSWORD_HASH** : `npm run hash-password -- "TonNouveauMotDePasse"` puis colle la ligne affichée.
4. **CLIENT_ORIGINS** : les adresses du site autorisées à appeler l'API (déjà préremplie pour GitHub Pages et Live Server (ports 3000 et 5500)).

Ouvre ensuite le site (Live Server) : `js/api.js` vise automatiquement `http://localhost:5000/api` en local.

Pour tester l'oubli de mot de passe sans e-mail : le lien de réinitialisation s'affiche dans la console de l'API.

## 2. Mettre en ligne (Render, gratuit)

1. Pousse le projet sur GitHub (**sans** `.env` : il est dans `.gitignore`).
2. Sur https://render.com → *New → Web Service* → ton dépôt.
   - **Root Directory** : `server` · **Build Command** : `npm install` · **Start Command** : `npm start`
3. Onglet *Environment* : ajoute toutes les variables de `.env.example` avec `NODE_ENV=production`.
   `CLIENT_URL` = l'adresse publique de ton site (ex. `https://132737li.github.io/Berlly-Boutique`).
4. Dans le site, ouvre `js/api.js` et remplace `PRODUCTION_API_URL` par l'adresse Render + `/api`
   (ex. `https://berlly-api.onrender.com/api`), puis publie le site.

Le plan gratuit de Render s'endort après 15 min d'inactivité : la première requête peut prendre ~30 s.

## 3. E-mails (mot de passe oublié) en production

Renseigne `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. Un service gratuit comme
Brevo (300 e-mails/jour) convient. Sans SMTP, aucun e-mail ne part : le lien n'apparaît que dans les journaux.

## 4. Tests

```bash
npm test
```

Les tests utilisent des modèles simulés en mémoire (aucune base nécessaire) et vérifient notamment : e-mail non
modifiable, total recalculé, séparation client / admin, injections NoSQL, limitation de débit, liens de
réinitialisation à usage unique.

## Limites connues

- Les **prix** viennent encore du navigateur (tes produits sont écrits dans les pages HTML, pas dans la base).
  Le serveur recalcule le total mais ne peut pas vérifier qu'un prix est le vrai. Pour y remédier : stocker
  les produits côté serveur.
- Les photos de profil sont stockées dans MongoDB (256×256, ~20 Ko) : pratique, mais pas fait pour de gros volumes.
