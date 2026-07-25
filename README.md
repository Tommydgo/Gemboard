# Gemboard

Gemboard est un outil de gestion de tâches en mode Kanban : créez des tableaux, organisez-les en listes, et suivez vos tâches de "à faire" à "terminé".

## Utilisation

### Créer un compte

1. Rendez-vous sur la page d'inscription.
2. Renseignez votre email, votre nom, votre prénom et un mot de passe.
3. Validez : vous êtes automatiquement connecté·e après l'inscription.

### Se connecter

Sur la page de connexion, entrez votre email et votre mot de passe. Vous êtes redirigé·e vers vos tableaux.

### Créer un tableau

Depuis la page **Mes tableaux**, cliquez sur le bouton de création, donnez un nom à votre tableau, et il apparaît dans votre liste.

### Organiser un tableau en listes et tâches

Ouvrez un tableau pour accéder à la page **Mes tâches** :

- **Listes** : créez des colonnes (ex. "À faire", "En cours", "Terminé") pour organiser vos tâches. Elles peuvent être réordonnées.
- **Tâches** : dans une liste, créez une tâche avec un titre, une description et une date d'échéance. Vous pouvez la déplacer d'une liste à une autre, ou changer sa position dans la liste.

### Gérer son profil

La page **Profil** permet de modifier vos informations personnelles (email, nom, prénom) et votre mot de passe.

---

## Documentation technique

### Stack

- **Backend** : Node.js, Express 5, TypeScript (exécuté via [tsx](https://github.com/privatenumber/tsx)), authentification par JWT, mots de passe hashés avec `bcryptjs`.
- **Base de données** : SQLite (`better-sqlite3`), embarquée dans le service — aucun serveur de base de données externe requis.
- **Frontend** : HTML / CSS / JavaScript statiques (sans framework), servis directement par le backend Express.

### Installation locale

```bash
npm install
```

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

| Variable      | Requis | Description                                                                 |
|---------------|--------|-------------------------------------------------------------------------------|
| `PORT`        | oui    | Port d'écoute du serveur.                                                    |
| `SECRET`      | oui    | Clé secrète utilisée pour signer les JWT.                                    |
| `SQLITE_PATH` | non    | Chemin du fichier de base SQLite. Par défaut : `backend/data.sqlite`.        |

### Lancer le projet

```bash
npm start
```

Le serveur sert à la fois l'API (`/login`, `/register`, `/boards`, `/lists`, `/todos`, `/user`, …) et les fichiers statiques du frontend (`frontend/`). Rendez-vous sur `http://localhost:<PORT>/login.html` pour utiliser l'application.

Au démarrage, le schéma de base de données (`backend/src/config/schema.sql`) est automatiquement appliqué si les tables n'existent pas encore.

### Structure du projet

```
backend/
  src/
    config/       # connexion à la base SQLite + schéma
    middleware/    # authentification JWT, gestion des routes inconnues
    routes/        # routes et requêtes SQL par domaine (auth, user, boards, lists, todos)
    index.ts       # point d'entrée du serveur Express
frontend/
  *.html           # pages (connexion, inscription, tableaux, tâches, profil)
  css/             # styles
  js/              # logique client + appels API (js/api.js)
```

### Déploiement

Le projet est pensé pour être déployé comme un **service unique** (ex. Render Web Service) : `npm install` puis `npm start`. Le frontend et l'API sont servis depuis la même origine, donc aucune configuration CORS particulière n'est nécessaire côté client.

⚠️ La base SQLite étant stockée sur le disque du service, elle est réinitialisée à chaque redéploiement (disque éphémère). Pour une persistance durable des données, il faudrait migrer vers un disque persistant ou une base de données externe hébergée.
