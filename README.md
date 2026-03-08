# Ping-Pong Club — Application de disponibilités

Application web mobile-friendly pour la gestion des joueurs, équipes et disponibilités des matchs de tennis de table (voir [SPEC.md](docs/SPEC.md)).

## Phase 0 — Développement local avec données mock

- **Stack** : Vite, React, TypeScript, Tailwind CSS, React Router
- **Connexion en dev** : page de login avec autocomplétion des utilisateurs (aucun mot de passe)
- **Données** : tout est en mock dans `src/mock/data.ts`

### Lancer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173). Se connecter en choisissant un utilisateur dans l'autocomplétion.

### Utilisateurs mock

| Rôle               | Email                    |
|--------------------|--------------------------|
| Administrateur général | admin@example.com        |
| Admin club         | club.admin@example.com   |
| Capitaine          | marie.dupont@example.com |
| Joueurs            | jean.martin@example.com, etc. |
