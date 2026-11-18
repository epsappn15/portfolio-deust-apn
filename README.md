# Portfolio DEUST STAPS AGAPSC – Activités de pleine nature

Prototype V1.0. Node.js 20+, sans dépendance externe.

## Lancer
`npm start`, puis ouvrir http://localhost:3000.

## Déployer sur Render
Créer un Web Service depuis ce dépôt GitHub. Runtime Node, Build `npm install`, Start `npm start`. Le fichier render.yaml contient la configuration de base.

## Fonctions
- Référentiel transversal : 6 domaines, 18 critères.
- Trame de compétences pour escalade, PAH, trail, course d’orientation, VTT, kayak, SUP et voile.
- Observations successives par étudiant, tuteur ou enseignant, avec niveaux et commentaires.
- Suivi des périodes de stage DEUST 1 et 2 et progression Observation → Participation → Responsabilité encadrée → Autonomie.
- Preuves documentaires (métadonnées locales) et impression / enregistrement PDF via le navigateur.

## Limites importantes
Ceci est un prototype de démonstration. Les données restent dans le localStorage du navigateur : elles ne sont ni partagées entre utilisateurs ni sauvegardées sur un serveur. Les fichiers ne sont pas téléversés. Il n’y a pas encore d’authentification réelle, de base de données, de permissions sécurisées ni de gestion des invitations. Ne pas saisir de données personnelles ou confidentielles d’étudiants avant mise en place de ces éléments.
