# Portfolio DEUST APN — V2 simplifiée

## Fonctionnement retenu
- **Étudiant** : accès individuel avec identifiant et code personnel générés par l'enseignant.
- **Enseignant** : accès centralisé avec identifiant et mot de passe définis dans Render ; consultation de tous les portfolios D1/D2, création des accès étudiants et ajout d'évaluations.
- Base Turso dédiée au portfolio. Ne réutilisez pas la base ni les secrets de Vélo connecté.
- Charte Université de Poitiers / STAPS et logos fournis.

## Déploiement
1. Décompresser cette archive et déposer son contenu à la racine du dépôt GitHub privé `portfolio-deust-apn`.
2. Dans Render, créer un **nouveau** Web Service depuis ce dépôt. Ne pas modifier les services existants.
3. Runtime Node, région Frankfurt, build `npm install`, start `npm start`, health `/health`.
4. Créer une base Turso distincte pour le portfolio.
5. Ajouter dans Render > Environment :
   - `TURSO_DATABASE_URL` : URL de la base portfolio.
   - `TURSO_AUTH_TOKEN` : jeton d'accès de cette base.
   - `ADMIN_USER` : identifiant enseignant.
   - `ADMIN_PASSWORD` : mot de passe enseignant robuste et unique.
   - `SESSION_SECRET` : chaîne aléatoire longue (32 caractères ou plus).
   - `NODE_ENV` : `production`.
6. Déployer. Vérifier `https://...onrender.com/health`.
7. Se connecter à l'espace enseignant, ouvrir « Créer un étudiant », choisir D1 ou D2, puis transmettre à l'étudiant son identifiant et son code personnel. Le code n'est montré qu'une fois : le conserver dans un canal sécurisé.
8. Tester avec des comptes fictifs avant toute donnée réelle.

## Limites de cette V2
- Cette version est un socle de travail, pas une version certifiée institutionnelle.
- L'accès tuteur n'est pas encore inclus ; l'enseignant consulte et évalue.
- Les critères transversaux 6 domaines / 18 items sont préchargés dans l'application. Les critères techniques détaillés des 8 activités restent à construire et faire valider par l'équipe pédagogique.
- Les justificatifs ne sont pas encore téléversables ; le tableau « preuves » est prévu dans le schéma d'évolution.
- Les heures de stage sont déclarées par le volume des expériences ; le workflow de validation des heures par l'enseignant est à développer.
- Prévoir sauvegardes, procédure de récupération, contrôle des accès, durées de conservation, information des étudiants, validation DSI/DPO et conformité RGPD avant un pilote réel.
- Le code d'accès étudiant est un secret : ne pas l'envoyer dans un canal public. La session serveur est en mémoire ; un redémarrage déconnecte les utilisateurs. Pour montée en charge, prévoir un stockage de session persistant.
- Les politiques d'accès et la sécurité doivent faire l'objet d'un audit avant production.

## Développement local
Node.js 20+ :
```bash
npm install
ADMIN_USER=enseignant ADMIN_PASSWORD='mot-de-passe-local' SESSION_SECRET='secret-local-long' npm start
```
Sans TURSO_DATABASE_URL, la connexion à la base n'est pas initialisée ; configurez une base Turso de test pour l'usage complet.
