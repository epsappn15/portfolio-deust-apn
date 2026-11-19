const express=require("express");
const session=require("express-session");
const bcrypt=require("bcryptjs");
const {createClient}=require("@libsql/client");
const crypto=require("crypto");
const path=require("path");
const app=express();
// Render termine le HTTPS en amont : faire confiance au proxy pour que les cookies secure soient émis.
app.set("trust proxy",1);
const PORT=process.env.PORT||3000;
const db=createClient({url:process.env.TURSO_DATABASE_URL||"file:portfolio.db",authToken:process.env.TURSO_AUTH_TOKEN});
const required=["ADMIN_USER","ADMIN_PASSWORD","SESSION_SECRET","TURSO_DATABASE_URL","TURSO_AUTH_TOKEN"];
app.disable("x-powered-by"); app.use(express.json({limit:"6mb"}));
app.use(session({name:"deust.sid",secret:process.env.SESSION_SECRET||"development-only-change-me",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));
const schema=[
`create table if not exists students(id text primary key,name text not null,email text,promo text not null check(promo in ('D1','D2')),access_hash text not null,created_at text default current_timestamp)`,
`create table if not exists internships(id text primary key,student_id text not null references students(id),year integer not null,kind text not null,organization text not null,expected_hours real default 0,start_date text,end_date text,created_at text default current_timestamp)`,
`create table if not exists experiences(id text primary key,student_id text not null references students(id),internship_id text,activity text not null,entry_date text not null,hours real default 0,mission text not null,reflection text,created_at text default current_timestamp)`,
`create table if not exists evaluations(id text primary key,student_id text not null references students(id),competency_id text not null,level text not null,author text not null,comment text,entry_date text default current_timestamp)`,
`create table if not exists evidence(id text primary key,student_id text not null references students(id),experience_id text,file_name text not null,note text,created_at text default current_timestamp)`,
`create table if not exists activity_skills(id text primary key,activity text not null,title text not null,description text,proposed integer default 1,created_at text default current_timestamp)`,
`create table if not exists tutors(id text primary key,name text not null,email text,access_hash text not null,created_at text default current_timestamp)`,
`create table if not exists tutor_students(tutor_id text not null,student_id text not null,primary key(tutor_id,student_id))`,
`create table if not exists evidence_files(id text primary key,student_id text not null,experience_id text,competency_id text,file_name text not null,mime_type text not null,data_base64 text not null,note text,created_at text default current_timestamp)`,
`create table if not exists pedagogical_reports(id text primary key,student_id text not null references students(id),start_date text not null,end_date text not null,teacher_comment text,objectives text,created_at text default current_timestamp)`,
`create table if not exists tutor_stage_reviews(id text primary key,tutor_id text not null,student_id text not null,internship_id text not null,appreciation text,points_forts text,axes_progres text,created_at text default current_timestamp)`,
 `create table if not exists teacher_tutor_comments(id text primary key,review_id text not null,student_id text not null,comment text not null,created_at text default current_timestamp)`,
 `create table if not exists student_journal(id text primary key,student_id text not null,activity text,entry_date text not null,situation text not null,role text,analysis text,learning text,created_at text default current_timestamp)`,
 `create table if not exists student_goals(id text primary key,student_id text not null,title text not null,description text,status text default 'À travailler',due_date text,created_at text default current_timestamp)`,
 `create table if not exists teacher_messages(id text primary key,title text not null,body text not null,promo text,created_at text default current_timestamp)`,
 `create table if not exists internship_hour_validations(id text primary key,internship_id text not null,tutor_id text not null,hours real not null,comment text,created_at text default current_timestamp)`
];
const domains=[
["Gestion de la sécurité",["Identifie les enjeux de sécurité","Présente les règles de sécurité","Identifie les prises de risque et agit pour éviter un accident"]],
["Maîtrise de l’activité",["Connaît les spécificités de l’activité","Utilise la terminologie adaptée","Distingue et hiérarchise les niveaux de pratique"]],
["Gestion du matériel",["Utilise le matériel de manière adaptée","Vérifie, gère et entretient le matériel","Anticipe et prépare le matériel nécessaire"]],
["Préparation des séances",["Utilise une méthodologie et un document pertinent","Planifie les différentes étapes de la séance","Anticipe les dispositifs, consignes et régulations"]],
["Contact avec le public accueilli",["Adopte une posture et une communication respectueuses","Mobilise le groupe avec dynamisme","Régule et adapte son intervention"]],
["Implication dans la structure",["Observe et questionne le fonctionnement","Adopte une posture professionnelle","Est force de proposition"]]
];
const activities=["Escalade","PAH","Trail","Course d’orientation","VTT","Kayak","Stand Up Paddle","Voile"];
const competencies=domains.flatMap((d,i)=>d[1].map((title,j)=>({id:`T${i+1}-${j+1}`,domain:d[0],title})));
const levels=["Non abordé","Non acquis","En cours","Acquis"];
const proposedSkills={
"Escalade":["Vérifier l’équipement individuel et collectif","Installer et contrôler un dispositif d’assurage adapté","Accompagner la progression d’un pratiquant selon son niveau","Appliquer les procédures de sécurité propres au site"],
"PAH":["Vérifier les agrès et les équipements de protection","Adapter les consignes à la difficulté des ateliers","Organiser la circulation et les zones d’attente","Accompagner les pratiquants dans le respect des règles de sécurité"],
"Trail":["Adapter un itinéraire aux capacités du groupe","Préparer la gestion de l’effort et de l’hydratation","Anticiper les risques liés au terrain et à la météo","Encadrer un groupe en milieu naturel"],
"Course d’orientation":["Concevoir un parcours adapté au public","Utiliser carte et boussole pour préparer l’activité","Organiser les départs, contrôles et retours","Prévoir les procédures de sécurité et de recherche"],
"VTT":["Contrôler l’état et les réglages des vélos","Adapter le parcours au niveau des pratiquants","Transmettre les fondamentaux techniques et règles de circulation","Prévenir les risques liés au terrain et au matériel"],
"Kayak":["Vérifier embarcations, équipements et conditions de pratique","Préparer l’embarquement et le débarquement","Transmettre les consignes de navigation et de sécurité","Adapter la séance aux conditions du milieu et au groupe"],
"Stand Up Paddle":["Vérifier planches, pagaies et équipements de sécurité","Organiser la mise à l’eau et le retour","Transmettre les fondamentaux d’équilibre et de propulsion","Adapter la zone et les consignes aux conditions du milieu"],
"Voile":["Contrôler le matériel et préparer l’embarcation","Identifier les conditions météo et leurs évolutions","Transmettre les fondamentaux de conduite et de sécurité","Organiser la séance et les procédures de retour au port"]}
async function initDb(){for(const q of schema)await db.execute(q);for(const col of ["actual_hours real default 0","tutor_name text","tutor_email text","missions text","assessment text","progression text"]){try{await db.execute(`alter table internships add column ${col}`)}catch(e){}}for(const c of competencies)await db.execute({sql:"insert or ignore into competency_seed(id,domain,title) values(?,?,?)",args:[c.id,c.domain,c.title]}).catch(async()=>{await db.execute("create table if not exists competency_seed(id text primary key,domain text,title text)");await db.execute({sql:"insert or ignore into competency_seed(id,domain,title) values(?,?,?)",args:[c.id,c.domain,c.title]})});for(const [activity,titles] of Object.entries(proposedSkills)){for(let i=0;i<titles.length;i++){const sid=`A-${activities.indexOf(activity)+1}-${i+1}`;await db.execute({sql:"insert or ignore into activity_skills(id,activity,title,description,proposed) values(?,?,?,?,1)",args:[sid,activity,titles[i],"Proposition de travail à valider par l’équipe pédagogique."]})}}}
function id(){return crypto.randomUUID()}
function auth(req,res,next){if(!req.session.user)return res.status(401).json({error:"Connexion requise"});next()}
function teacher(req,res,next){if(!req.session.user||req.session.user.role!=="teacher")return res.status(403).json({error:"Accès enseignant requis"});next()}
function tutor(req,res,next){if(!req.session.user||req.session.user.role!=="tutor")return res.status(403).json({error:"Accès tuteur requis"});next()}
app.get("/health",(_q,r)=>r.json({status:"ok",app:"portfolio-deust-apn"}));
app.post("/api/login",async(req,res)=>{const {role,username,password,studentId,code}=req.body||{};if(role==="teacher"){if(username===process.env.ADMIN_USER&&password===process.env.ADMIN_PASSWORD){req.session.user={role:"teacher",name:"Espace enseignant"};return res.json({ok:true,user:req.session.user})}return res.status(401).json({error:"Identifiants enseignants incorrects."})}
if(role==="student"){const row=await db.execute({sql:"select * from students where id=?",args:[studentId]});const s=row.rows[0];if(s&&await bcrypt.compare(code||"",s.access_hash)){req.session.user={role:"student",studentId:s.id,name:s.name,promo:s.promo};return res.json({ok:true,user:req.session.user})}return res.status(401).json({error:"Identifiant étudiant ou code incorrect."})}if(role==="tutor"){const row=await db.execute({sql:"select * from tutors where email=?",args:[username]});const x=row.rows[0];if(x&&await bcrypt.compare(password||"",x.access_hash)){req.session.user={role:"tutor",tutorId:x.id,name:x.name};return res.json({ok:true,user:req.session.user})}return res.status(401).json({error:"Identifiants tuteur incorrects."})}res.status(400).json({error:"Type de connexion invalide."})});
app.post("/api/logout",(q,r)=>q.session.destroy(()=>r.json({ok:true})));
app.get("/api/me",auth,(q,r)=>r.json(q.session.user));
app.get("/api/students",teacher,async(q,r)=>{const x=await db.execute("select id,name,email,promo,created_at from students order by promo,name");r.json(x.rows)});
app.post("/api/students",teacher,async(q,r)=>{const {name,email,promo}=q.body||{};if(!name||!["D1","D2"].includes(promo))return r.status(400).json({error:"Nom et promotion D1/D2 obligatoires."});const studentId=id(),code=String(crypto.randomInt(100000,999999)),hash=await bcrypt.hash(code,10);await db.execute({sql:"insert into students(id,name,email,promo,access_hash) values(?,?,?,?,?)",args:[studentId,name,email||null,promo,hash]});r.json({id:studentId,name,email,promo,code})});
app.delete("/api/students/:studentId",teacher,async(q,r)=>{const sid=q.params.studentId;const found=await db.execute({sql:"select id from students where id=?",args:[sid]});if(!found.rows.length)return r.status(404).json({error:"Étudiant introuvable."});await db.batch([{sql:"delete from evidence where student_id=?",args:[sid]},{sql:"delete from experiences where student_id=?",args:[sid]},{sql:"delete from internships where student_id=?",args:[sid]},{sql:"delete from evaluations where student_id=?",args:[sid]},{sql:"delete from students where id=?",args:[sid]}],"write");r.json({ok:true});});
function scope(req){return req.session.user.role==="teacher"?null:req.session.user.studentId}
app.get("/api/portfolio/:studentId",auth,async(q,r)=>{const sid=q.params.studentId;if(scope(q)&&scope(q)!==sid)return r.sendStatus(403);const [s,i,e,v]=await Promise.all([db.execute({sql:"select id,name,email,promo from students where id=?",args:[sid]}),db.execute({sql:"select * from internships where student_id=? order by created_at desc",args:[sid]}),db.execute({sql:"select * from experiences where student_id=? order by entry_date desc",args:[sid]}),db.execute({sql:"select * from evaluations where student_id=? order by entry_date desc",args:[sid]})]);const [as,evf]=await Promise.all([db.execute("select * from activity_skills order by activity,id"),db.execute({sql:"select id,student_id,experience_id,competency_id,file_name,mime_type,note,created_at from evidence_files where student_id=? order by created_at desc",args:[sid]})]);const reviews=await db.execute({sql:"select r.*,i.organization,i.year,i.kind,t.name as tutor_name from tutor_stage_reviews r left join internships i on i.id=r.internship_id left join tutors t on t.id=r.tutor_id where r.student_id=? order by r.created_at desc",args:[sid]});const goals=await db.execute({sql:"select * from student_goals where student_id=? order by created_at desc",args:[sid]});const journal=await db.execute({sql:"select * from student_journal where student_id=? order by entry_date desc",args:[sid]});r.json({student:s.rows[0],internships:i.rows,experiences:e.rows,evaluations:v.rows,competencies,levels,activities,activitySkills:as.rows,evidenceFiles:evf.rows,stageReviews:reviews.rows,goals:goals.rows,journal:journal.rows})});
app.post("/api/internships",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {year,kind,organization,expected_hours,start_date,end_date}=q.body;if(!sid||!organization)return r.status(400).json({error:"Données incomplètes"});if(scope(q)&&q.body.studentId&&q.body.studentId!==sid)return r.sendStatus(403);const internshipId=id();await db.execute({sql:"insert into internships(id,student_id,year,kind,organization,expected_hours,start_date,end_date,actual_hours,tutor_name,tutor_email,missions,assessment,progression) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",args:[internshipId,sid,year,kind,organization,expected_hours||0,start_date||null,end_date||null,q.body.actual_hours||0,q.body.tutor_name||null,q.body.tutor_email||null,q.body.missions||null,q.body.assessment||null,q.body.progression||null]});r.json({id:internshipId})});
app.put("/api/internships/:internshipId",auth,async(q,r)=>{const sid=scope(q);const found=await db.execute({sql:"select id,student_id from internships where id=?",args:[q.params.internshipId]});const row=found.rows[0];if(!row)return r.status(404).json({error:"Stage introuvable."});if(sid&&row.student_id!==sid)return r.sendStatus(403);const b=q.body||{};if(!b.organization||! [1,2].includes(Number(b.year))||! ["filé","massé","alternance"].includes(b.kind))return r.status(400).json({error:"Année, type et structure d’accueil obligatoires."});await db.execute({sql:"update internships set year=?,kind=?,organization=?,expected_hours=?,actual_hours=?,tutor_name=?,tutor_email=?,missions=?,assessment=?,progression=?,start_date=?,end_date=? where id=?",args:[Number(b.year),b.kind,b.organization,Number(b.expected_hours||0),Number(b.actual_hours||0),b.tutor_name||null,b.tutor_email||null,b.missions||null,b.assessment||null,b.progression||null,b.start_date||null,b.end_date||null,q.params.internshipId]});r.json({ok:true})});
app.delete("/api/internships/:internshipId",auth,async(q,r)=>{const sid=scope(q);const found=await db.execute({sql:"select id,student_id from internships where id=?",args:[q.params.internshipId]});const row=found.rows[0];if(!row)return r.status(404).json({error:"Stage introuvable."});if(sid&&row.student_id!==sid)return r.sendStatus(403);await db.execute({sql:"update experiences set internship_id=null where internship_id=?",args:[q.params.internshipId]});await db.execute({sql:"delete from internships where id=?",args:[q.params.internshipId]});r.json({ok:true})});
app.post("/api/experiences",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {activity,entry_date,hours,mission,reflection,internship_id}=q.body;if(!sid||!activity||!entry_date||!mission)return r.status(400).json({error:"Date, activité et mission obligatoires"});const eid=id();await db.execute({sql:"insert into experiences(id,student_id,internship_id,activity,entry_date,hours,mission,reflection) values(?,?,?,?,?,?,?,?)",args:[eid,sid,internship_id||null,activity,entry_date,hours||0,mission,reflection||null]});r.json({id:eid})});
app.post("/api/evaluations",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {competency_id,level,comment}=q.body;if(!sid||!competencies.some(c=>c.id===competency_id)||!levels.includes(level))return r.status(400).json({error:"Évaluation invalide"});const eid=id();await db.execute({sql:"insert into evaluations(id,student_id,competency_id,level,author,comment) values(?,?,?,?,?,?)",args:[eid,sid,competency_id,level,q.session.user.role,comment||null]});r.json({id:eid})});
app.get("/api/teacher/portfolio/:studentId",teacher,async(q,r)=>{const sid=q.params.studentId;const [s,i,e,v]=await Promise.all([db.execute({sql:"select id,name,email,promo from students where id=?",args:[sid]}),db.execute({sql:"select * from internships where student_id=? order by created_at desc",args:[sid]}),db.execute({sql:"select * from experiences where student_id=? order by entry_date desc",args:[sid]}),db.execute({sql:"select * from evaluations where student_id=? order by entry_date desc",args:[sid]})]);const [as,evf]=await Promise.all([db.execute("select * from activity_skills order by activity,id"),db.execute({sql:"select id,student_id,experience_id,competency_id,file_name,mime_type,note,created_at from evidence_files where student_id=? order by created_at desc",args:[sid]})]);const reviews=await db.execute({sql:"select r.*,i.organization,i.year,i.kind,t.name as tutor_name from tutor_stage_reviews r left join internships i on i.id=r.internship_id left join tutors t on t.id=r.tutor_id where r.student_id=? order by r.created_at desc",args:[sid]});const goals=await db.execute({sql:"select * from student_goals where student_id=? order by created_at desc",args:[sid]});const journal=await db.execute({sql:"select * from student_journal where student_id=? order by entry_date desc",args:[sid]});r.json({student:s.rows[0],internships:i.rows,experiences:e.rows,evaluations:v.rows,competencies,levels,activities,activitySkills:as.rows,evidenceFiles:evf.rows,stageReviews:reviews.rows,goals:goals.rows,journal:journal.rows})});
// Bilans pédagogiques enregistrés : création réservée à l'enseignant, lecture par l'étudiant concerné.
app.post("/api/teacher/reports/:studentId",teacher,async(q,r)=>{
 const {start_date,end_date,teacher_comment,objectives}=q.body||{};
 if(!start_date||!end_date||start_date>end_date)return r.status(400).json({error:"Période invalide."});
 const exists=await db.execute({sql:"select id from students where id=?",args:[q.params.studentId]});
 if(!exists.rows.length)return r.status(404).json({error:"Étudiant introuvable."});
 const rid=id();
 await db.execute({sql:"insert into pedagogical_reports(id,student_id,start_date,end_date,teacher_comment,objectives) values(?,?,?,?,?,?)",args:[rid,q.params.studentId,start_date,end_date,teacher_comment||null,objectives||null]});
 r.json({id:rid,ok:true});
});
app.get("/api/student/reports",auth,async(q,r)=>{
 if(q.session.user.role!=="student")return r.status(403).json({error:"Accès étudiant requis."});
 const x=await db.execute({sql:"select id,start_date,end_date,teacher_comment,objectives,created_at from pedagogical_reports where student_id=? order by created_at desc",args:[q.session.user.studentId]});
 r.json(x.rows);
});
app.get("/api/teacher/reports/:studentId",teacher,async(q,r)=>{
 const x=await db.execute({sql:"select id,start_date,end_date,teacher_comment,objectives,created_at from pedagogical_reports where student_id=? order by created_at desc",args:[q.params.studentId]});
 r.json(x.rows);
});
// Référentiel technique APN : les critères initiaux sont des propositions à valider.
app.get("/api/activity-skills",auth,async(q,r)=>{const x=await db.execute("select * from activity_skills order by activity,id");r.json(x.rows)});
app.post("/api/activity-skills",teacher,async(q,r)=>{const {activity,title,description}=q.body||{};if(!activities.includes(activity)||!title)return r.status(400).json({error:"Activité et intitulé obligatoires."});const sid=id();await db.execute({sql:"insert into activity_skills(id,activity,title,description,proposed) values(?,?,?,?,1)",args:[sid,activity,title,description||""]});r.json({id:sid})});
app.put("/api/activity-skills/:skillId",teacher,async(q,r)=>{const {title,description}=q.body||{};if(!title||!title.trim())return r.status(400).json({error:"L’intitulé est obligatoire."});const result=await db.execute({sql:"update activity_skills set title=?,description=? where id=?",args:[title.trim(),description||"",q.params.skillId]});if(!result.rowsAffected)return r.status(404).json({error:"Critère introuvable."});r.json({ok:true})});
app.post("/api/activity-skills/:skillId/validate",teacher,async(q,r)=>{const result=await db.execute({sql:"update activity_skills set proposed=0 where id=?",args:[q.params.skillId]});if(!result.rowsAffected)return r.status(404).json({error:"Critère introuvable."});r.json({ok:true})});
app.delete("/api/activity-skills/:skillId",teacher,async(q,r)=>{const used=await db.execute({sql:"select count(*) as total from evaluations where competency_id=?",args:[q.params.skillId]});if(Number(used.rows[0]?.total||0)>0)return r.status(409).json({error:"Ce critère possède déjà des évaluations. Il ne peut pas être supprimé afin de préserver l’historique."});const result=await db.execute({sql:"delete from activity_skills where id=?",args:[q.params.skillId]});if(!result.rowsAffected)return r.status(404).json({error:"Critère introuvable."});r.json({ok:true})});
app.post("/api/activity-evaluations",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {skill_id,level,comment}=q.body||{};const sk=await db.execute({sql:"select id from activity_skills where id=?",args:[skill_id]});if(!sid||!sk.rows.length||!levels.includes(level))return r.status(400).json({error:"Évaluation invalide."});const eid=id();await db.execute({sql:"insert into evaluations(id,student_id,competency_id,level,author,comment) values(?,?,?,?,?,?)",args:[eid,sid,skill_id,level,q.session.user.role,comment||null]});r.json({id:eid})});
// Dépôt de preuves dans la base Turso, limité à 4 Mo par fichier.
app.post("/api/evidence",auth,async(q,r)=>{const {studentId,experience_id,competency_id,file_name,mime_type,data_base64,note}=q.body||{};const sid=scope(q)||studentId;if(!sid||!file_name||!mime_type||!data_base64)return r.status(400).json({error:"Fichier incomplet."});if(scope(q)&&studentId&&studentId!==sid)return r.sendStatus(403);const bytes=Buffer.from(data_base64,"base64");if(bytes.length>4*1024*1024)return r.status(413).json({error:"Fichier trop volumineux (4 Mo maximum)."});if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(mime_type))return r.status(415).json({error:"Formats acceptés : PDF, JPG, PNG ou WEBP."});const eid=id();await db.execute({sql:"insert into evidence_files(id,student_id,experience_id,competency_id,file_name,mime_type,data_base64,note) values(?,?,?,?,?,?,?,?)",args:[eid,sid,experience_id||null,competency_id||null,file_name,mime_type,bytes.toString("base64"),note||null]});r.json({id:eid})});
app.get("/api/evidence/:id",auth,async(q,r)=>{const x=await db.execute({sql:"select * from evidence_files where id=?",args:[q.params.id]});const f=x.rows[0];if(!f)return r.sendStatus(404);if(scope(q)&&scope(q)!==f.student_id)return r.sendStatus(403);if(q.session.user.role==="tutor"){const a=await db.execute({sql:"select 1 from tutor_students where tutor_id=? and student_id=?",args:[q.session.user.tutorId,f.student_id]});if(!a.rows.length)return r.sendStatus(403)}const b=Buffer.from(f.data_base64,"base64");r.setHeader("Content-Type",f.mime_type);r.setHeader("Content-Disposition",`attachment; filename*=UTF-8''${encodeURIComponent(f.file_name)}`);r.send(b)});
app.post("/api/tutors",teacher,async(q,r)=>{const {name,email,studentIds=[]}=q.body||{};if(!name||!email||!Array.isArray(studentIds))return r.status(400).json({error:"Nom, email et étudiants requis."});const tid=id(),password=String(crypto.randomInt(10000000,99999999)),hash=await bcrypt.hash(password,10);await db.execute({sql:"insert into tutors(id,name,email,access_hash) values(?,?,?,?)",args:[tid,name,email,hash]});for(const sid of studentIds)await db.execute({sql:"insert or ignore into tutor_students(tutor_id,student_id) values(?,?)",args:[tid,sid]});r.json({id:tid,name,email,password})});
app.get("/api/tutors",teacher,async(q,r)=>{
 const rows=await db.execute("select id,name,email,created_at from tutors order by name");
 const links=await db.execute("select tutor_id,student_id from tutor_students");
 r.json(rows.rows.map(t=>({...t,studentIds:links.rows.filter(x=>x.tutor_id===t.id).map(x=>x.student_id)})));
});
app.put("/api/tutors/:id",teacher,async(q,r)=>{
 const {name,email,studentIds=[]}=q.body||{};
 if(!String(name||"").trim()||!String(email||"").trim()||!Array.isArray(studentIds))return r.status(400).json({error:"Nom, email et liste d’étudiants requis."});
 const found=await db.execute({sql:"select id from tutors where id=?",args:[q.params.id]});
 if(!found.rows.length)return r.status(404).json({error:"Compte tuteur introuvable."});
 const valid=await db.execute({sql:"select id from students"});
 const validIds=new Set(valid.rows.map(x=>x.id));
 if(studentIds.some(x=>!validIds.has(x)))return r.status(400).json({error:"Un étudiant sélectionné est invalide."});
 await db.execute({sql:"update tutors set name=?,email=? where id=?",args:[String(name).trim(),String(email).trim(),q.params.id]});
 await db.execute({sql:"delete from tutor_students where tutor_id=?",args:[q.params.id]});
 for(const sid of [...new Set(studentIds)])await db.execute({sql:"insert into tutor_students(tutor_id,student_id) values(?,?)",args:[q.params.id,sid]});
 r.json({ok:true});
});
app.post("/api/tutors/:id/reset-password",teacher,async(q,r)=>{
 const found=await db.execute({sql:"select id from tutors where id=?",args:[q.params.id]});
 if(!found.rows.length)return r.status(404).json({error:"Compte tuteur introuvable."});
 const password=String(crypto.randomInt(10000000,99999999));
 const hash=await bcrypt.hash(password,10);
 await db.execute({sql:"update tutors set access_hash=? where id=?",args:[hash,q.params.id]});
 r.json({ok:true,password});
});

// Retours de stage : le tuteur ne peut écrire que sur un étudiant qui lui est attribué.
app.post("/api/tutor/reviews/:studentId/:internshipId",tutor,async(q,r)=>{
 const assigned=await db.execute({sql:"select 1 from tutor_students where tutor_id=? and student_id=?",args:[q.session.user.tutorId,q.params.studentId]});
 if(!assigned.rows.length)return r.sendStatus(403);
 const stage=await db.execute({sql:"select id from internships where id=? and student_id=?",args:[q.params.internshipId,q.params.studentId]});
 if(!stage.rows.length)return r.status(404).json({error:"Stage introuvable pour cet étudiant."});
 const b=q.body||{};
 if(!String(b.appreciation||"").trim())return r.status(400).json({error:"Une appréciation générale est obligatoire."});
 const rid=id();
 await db.execute({sql:"insert into tutor_stage_reviews(id,tutor_id,student_id,internship_id,appreciation,points_forts,axes_progres) values(?,?,?,?,?,?,?)",args:[rid,q.session.user.tutorId,q.params.studentId,q.params.internshipId,String(b.appreciation).trim(),b.points_forts||null,b.axes_progres||null]});
 r.json({id:rid,ok:true});
});
app.get("/api/student/tutor-reviews",auth,async(q,r)=>{
 if(q.session.user.role!=="student")return r.status(403).json({error:"Accès étudiant requis."});
 const x=await db.execute({sql:"select r.id,r.internship_id,r.appreciation,r.points_forts,r.axes_progres,r.created_at,i.organization,i.year,i.kind from tutor_stage_reviews r left join internships i on i.id=r.internship_id where r.student_id=? order by r.created_at desc",args:[q.session.user.studentId]});
 r.json(x.rows);
});
app.get("/api/tutor/students",tutor,async(q,r)=>{const x=await db.execute({sql:"select s.id,s.name,s.promo from students s join tutor_students ts on ts.student_id=s.id where ts.tutor_id=? order by s.name",args:[q.session.user.tutorId]});r.json(x.rows)});
app.get("/api/tutor/portfolio/:studentId",tutor,async(q,r)=>{const a=await db.execute({sql:"select 1 from tutor_students where tutor_id=? and student_id=?",args:[q.session.user.tutorId,q.params.studentId]});if(!a.rows.length)return r.sendStatus(403);const sid=q.params.studentId;const [s,i,e,v,as,evf]=await Promise.all([db.execute({sql:"select id,name,promo from students where id=?",args:[sid]}),db.execute({sql:"select * from internships where student_id=?",args:[sid]}),db.execute({sql:"select * from experiences where student_id=?",args:[sid]}),db.execute({sql:"select * from evaluations where student_id=?",args:[sid]}),db.execute("select * from activity_skills order by activity,id"),db.execute({sql:"select id,file_name,note,created_at from evidence_files where student_id=?",args:[sid]})]);const reviews=await db.execute({sql:"select * from tutor_stage_reviews where student_id=? order by created_at desc",args:[sid]});r.json({student:s.rows[0],internships:i.rows,experiences:e.rows,evaluations:v.rows,competencies,levels,activities,activitySkills:as.rows,evidenceFiles:evf.rows,stageReviews:reviews.rows})});
app.use(express.static(path.join(__dirname,"public")));
app.get("*",(_q,r)=>r.sendFile(path.join(__dirname,"public","index.html")));
(async()=>{try{if(process.env.TURSO_DATABASE_URL)await initDb();app.listen(PORT,()=>console.log("DEUST APN listening on "+PORT));}catch(e){console.error(e);process.exit(1)}})();