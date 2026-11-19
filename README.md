# Portfolio DEUST APN – version enrichie

Cette version prolonge l'application déjà déployée. Elle conserve les comptes étudiants, les identifiants enseignants et les données existantes dans Turso : les nouvelles tables sont créées automatiquement au démarrage et les nouvelles colonnes de stage sont ajoutées de façon additive.

## Fonctionnalités

- Accès étudiant individuel, accès enseignant centralisé et accès tuteur limité aux étudiants qui lui sont associés.
- Gestion des étudiants (création et suppression côté enseignant).
- Carnet de bord des expériences et suivi des stages avec volume prévu/réalisé, dates, tuteur, missions, bilan et progression.
- Évaluation des 18 critères transversaux avec historique des observations.
- Référentiel de compétences APN pour les huit activités. Les critères préremplis sont explicitement des propositions pédagogiques à valider ; l'enseignant peut en ajouter.
- Autoévaluation étudiant sur les critères APN.
- Dépôt de justificatifs PDF/JPG/PNG/WEBP dans Turso, limite 4 Mo par fichier.
- Export PDF par la fonction Imprimer / Enregistrer en PDF du navigateur.
- Création d'accès tuteurs et attribution des étudiants visibles.

## Déploiement Render

1. Remplacer les fichiers du dépôt GitHub `portfolio-deust-apn` par le contenu de cette archive.
2. Commit/push sur la branche reliée à Render.
3. Laisser Render exécuter `npm install` puis `npm start`.
4. Ne pas modifier les variables d'environnement ni recréer la base Turso.

Variables attendues inchangées : `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `NODE_ENV=production`.

## Référentiel et stages

Les 18 critères transversaux et les niveaux d'évaluation reprennent la fiche d'évaluation des compétences des stages DEUST APN fournie. Les périodes reprennent le document de présentation des stages : D1 filé 150 h, D1 massé 300 h, D2 filé 300 h, D2 massé 300 h ou alternance en D2. L'alternance dépend du calendrier d'apprentissage. Les critères spécifiques aux huit activités sont proposés comme base de travail et doivent être validés par l'équipe pédagogique avant d'être considérés comme officiels.

## Limites et précautions

- L'export PDF utilise l'impression du navigateur ; choisir « Enregistrer au format PDF ».
- Les justificatifs sont stockés dans la base Turso en base64. Limite applicative : 4 Mo par fichier. Vérifier le quota et les coûts Turso avant un usage intensif.
- Les tuteurs disposent d'un accès en lecture aux seuls étudiants qui leur sont attribués ; les évaluations officielles restent saisies par l'étudiant ou l'enseignant dans cette version.
- La création d'un accès tuteur affiche un code temporaire une seule fois ; le transmettre de manière sécurisée.
- Faire valider les contenus pédagogiques, les durées, les rôles et les règles de conservation des justificatifs par l'équipe pédagogique et le DPO avant généralisation. Prévoir une sauvegarde régulière de la base.
- Cette version est une base fonctionnelle à tester en environnement pilote, pas une certification de conformité RGPD ou un audit de sécurité.


## V3.13 – Export PDF du portfolio
- Mise en page A4 dédiée à l’impression et à l’enregistrement PDF depuis le navigateur.
- Synthèse de progression, compétences transversales et par activité, stages, expériences et historique des évaluations.
- Depuis le portfolio, cliquer sur « Télécharger / imprimer le portfolio en PDF », puis choisir « Enregistrer au format PDF » dans la fenêtre d’impression.
