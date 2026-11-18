# Portfolio DEUST APN — V2 complète à déposer

Application web Node/Express + Supabase Auth/PostgreSQL, responsive et charte Université de Poitiers / STAPS.

## Contenu
- Authentification email / mot de passe Supabase (inscription et connexion).
- Espaces et rôles prévus : étudiant, tuteur, enseignant, administrateur.
- Carnet de bord connecté : expériences datées, activité, durée, mission et analyse réflexive.
- Déclaration des stages DEUST 1 / DEUST 2, filé / massé / alternance.
- Référentiel transversal prérempli avec les 6 domaines et 18 critères de la fiche de stage.
- Historique d'observations successives avec les quatre niveaux de la fiche : Non abordé, Non acquis, En cours, Acquis.
- Huit activités APN listées : Escalade, PAH, Trail, Course d’orientation, VTT, Kayak, Stand Up Paddle, Voile.
- Synthèse imprimable / PDF navigateur et logos institutionnels.
- Script SQL initial et configuration Render.

## Déploiement Render
1. Créer un dépôt GitHub privé `portfolio-deust-apn` et y déposer le contenu de cette archive (les fichiers doivent être à la racine).
2. Dans Render, créer un **nouveau Web Service** relié à ce dépôt. Ne pas modifier `course-orientation-staps` ni `velo-connecte-suaps`.
3. Paramètres : Node, région Frankfurt, build `npm install`, start `npm start`, health check `/health`.
4. Créer un projet Supabase séparé, dans une région UE compatible avec les exigences de l'établissement.
5. Dans Supabase > SQL Editor, examiner puis exécuter `supabase/schema.sql` sur le projet de développement.
6. Dans Render > Environment, définir `SUPABASE_URL` et `SUPABASE_ANON_KEY` (clé publique anon uniquement). Pour le client navigateur, les valeurs sont également à reporter dans `public/config.js` comme `SUPABASE_URL` et `SUPABASE_ANON_KEY`, puis committer/redéployer. Ne jamais utiliser `service_role`.
7. Dans Supabase > Authentication > URL Configuration, définir l'URL Render comme Site URL et ajouter cette URL à Redirect URLs.
8. Créer les comptes via l'écran d'inscription. L'email de confirmation peut être activé dans Supabase Auth.
9. Attribuer les rôles dans SQL Editor. Exemple pour un compte administrateur déjà créé :
   ```sql
   insert into public.profiles(id,email)
   select id,email from auth.users where email='admin@exemple.fr'
   on conflict (id) do nothing;
   insert into public.user_roles(user_id,role)
   select id,'admin' from auth.users where email='admin@exemple.fr'
   on conflict do nothing;
   ```
   Refaire pour les tuteurs/enseignants avec le rôle approprié. Pour les étudiants, attribuer `student`.
10. Vérifier `/health`, l'inscription, la connexion, le carnet de bord et la séparation des comptes.

## Important — état et limites de cette V2
Cette livraison est un socle applicatif connecté, pas une version certifiée pour un pilote réel :
- Le rôle est lu depuis `user_roles`, mais les vues tuteur/enseignant/admin sont encore à compléter : la navigation et certains écrans restent centrés sur le parcours étudiant.
- Le rattachement et l'invitation sécurisée d'un tuteur, la validation des heures, les évaluations par les encadrants, les pièces jointes privées, les exports PDF avancés et le journal d'audit ne sont pas encore finalisés.
- Les critères spécifiques détaillés aux huit activités doivent être élaborés et validés par l'équipe pédagogique ; ils ne sont pas inventés dans cette livraison.
- Le SQL constitue une base de développement à auditer. Les politiques RLS et le workflow de rôles doivent être revus et testés par la DSI / DPO avant tout usage avec des données personnelles.
- Prévoir information des personnes, minimisation des données, durées de conservation, sauvegardes, droits RGPD, procédure de suppression/export, et validation de l'hébergement par l'établissement.
- N'importez pas de données réelles d'étudiants avant validation institutionnelle.

## Démarrage local
Node.js 20+ :
```bash
npm install
npm start
```
Puis ouvrir `http://localhost:3000`. Sans configuration Supabase, l'écran de connexion indique la configuration manquante.
