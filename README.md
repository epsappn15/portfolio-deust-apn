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


## V3.14 – Tableau de bord enseignant de la promotion
- Nouvel onglet enseignant avec synthèse D1/D2, effectifs, critères acquis / en cours / non acquis / à évaluer et heures de stage déclarées.
- Vue individuelle filtrable par promotion, avec accès direct au portfolio étudiant.
- Les indicateurs sont calculés à partir des dernières évaluations enregistrées ; aucune donnée ni table de la base n’est modifiée.
- Actualisation manuelle disponible pour recharger les indicateurs.


## V3.15 – Bilan pédagogique de période / semestre
- Depuis le portfolio individuel dans l’espace enseignant, choisir une date de début et une date de fin puis générer un bilan imprimable.
- Le bilan synthétise les évaluations datées de la période, les acquis, les compétences en cours ou non acquises, les critères sans évaluation sur la période, les expériences et les stages concernés.
- Un champ permet à l’enseignant d’ajouter une appréciation et des objectifs de progression.
- Le bilan s’imprime ou s’enregistre en PDF via le navigateur. Aucun nouveau stockage ni changement de base n’est requis.
- Les données sans date exploitable ne sont pas intégrées aux listes filtrées par période ; les stages sans dates sont signalés comme non datés dans le bilan.


## V3.16 – Favicon assorti au logo de bandeau
- Création d’une icône carrée transparente à partir du logo DEUST APN exact utilisé dans le bandeau.
- Mise à jour des références favicon et Apple Touch Icon pour les onglets et raccourcis mobiles.
- Aucun changement de données, de serveur ou de configuration Render.


## V3.17 – Icône carrée plein cadre
- Les icônes favicon et Apple Touch Icon utilisent désormais un recadrage carré plein cadre du logo de bandeau, sans marge transparente autour.
- Le recadrage conserve le centre du logo et remplit intégralement le carré des raccourcis mobiles.


## V3.18 – Logo DEUST sans montagne en arrière-plan
- Suppression du motif de montagne en arrière-plan du logo DEUST APN du bandeau, en conservant les activités, les arbres, le texte et l’encadrement.
- Régénération du favicon et de l’icône de raccourci mobile à partir de ce logo modifié.


## V3.20 – Logo réorganisé selon la demande
- « DEUST APN » est placé au-dessus des personnages, sur la ligne visuelle des sapins.
- « Activités de Pleine Nature » est remonté juste sous les personnages et centré entre les deux traits latéraux.
- Le logo de bandeau, le favicon et l’icône mobile sont tous régénérés.


## V3.22 – Correction du double D et agrandissement du texte
- Reprise depuis le logo propre V3.20 afin d’éliminer tout caractère résiduel et éviter le doublon.
- Agrandissement de « DEUST APN » et de « Activités de Pleine Nature ».
- Mise à jour du favicon et de l’icône mobile à partir du logo corrigé.


## V3.23 – Bilans pédagogiques partagés avec les étudiants
- Les bilans générés par l’enseignant sont désormais enregistrés dans une nouvelle table `pedagogical_reports` créée automatiquement au démarrage.
- L’enseignant peut saisir une appréciation et des objectifs pour la période suivante, puis enregistrer le bilan.
- Un nouvel onglet « Bilans pédagogiques » est disponible dans l’espace étudiant pour consulter les bilans partagés, les appréciations et les objectifs.
- Routes protégées : création/consultation enseignant et consultation limitée à l’étudiant connecté.
- Migration non destructive : aucune table ou donnée existante n’est supprimée ou modifiée.


## V3.24 – Espace tuteur et retours de stage
- Le tuteur consulte les seuls étudiants qui lui sont attribués, leurs périodes de stage, missions, expériences et évaluations.
- Pour chaque stage, il peut transmettre une appréciation générale, des points forts observés et des axes de progrès.
- Les retours sont conservés dans une nouvelle table `tutor_stage_reviews` et restent consultables dans l’espace tuteur.
- Un nouvel onglet étudiant « Retours des tuteurs » permet de consulter les retours transmis.
- Les routes de saisie vérifient l’association tuteur/étudiant et l’appartenance du stage à cet étudiant.
- Migration additive, sans suppression ni modification des données existantes.


## V3.25 – Gestion des comptes tuteurs
- L’espace enseignant liste désormais les comptes tuteurs existants et leurs étudiants attribués.
- Modification du nom, de l’identifiant email et de la liste des étudiants accessibles.
- Réinitialisation du code d’accès avec génération d’un nouveau code temporaire ; l’ancien code devient invalide.
- Vérification côté serveur que les étudiants attribués existent.
- Aucune suppression de compte ni de retours de stage ; les données historiques sont préservées.
