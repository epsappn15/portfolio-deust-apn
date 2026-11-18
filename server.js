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
app.disable("x-powered-by"); app.use(express.json({limit:"1mb"}));
app.use(session({name:"deust.sid",secret:process.env.SESSION_SECRET||"development-only-change-me",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));
const schema=[
`create table if not exists students(id text primary key,name text not null,email text,promo text not null check(promo in ('D1','D2')),access_hash text not null,created_at text default current_timestamp)`,
`create table if not exists internships(id text primary key,student_id text not null references students(id),year integer not null,kind text not null,organization text not null,expected_hours real default 0,start_date text,end_date text,created_at text default current_timestamp)`,
`create table if not exists experiences(id text primary key,student_id text not null references students(id),internship_id text,activity text not null,entry_date text not null,hours real default 0,mission text not null,reflection text,created_at text default current_timestamp)`,
`create table if not exists evaluations(id text primary key,student_id text not null references students(id),competency_id text not null,level text not null,author text not null,comment text,entry_date text default current_timestamp)`,
`create table if not exists evidence(id text primary key,student_id text not null references students(id),experience_id text,file_name text not null,note text,created_at text default current_timestamp)`
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
async function initDb(){for(const q of schema)await db.execute(q);for(const c of competencies)await db.execute({sql:"insert or ignore into competency_seed(id,domain,title) values(?,?,?)",args:[c.id,c.domain,c.title]}).catch(async()=>{await db.execute("create table if not exists competency_seed(id text primary key,domain text,title text)");await db.execute({sql:"insert or ignore into competency_seed(id,domain,title) values(?,?,?)",args:[c.id,c.domain,c.title]})});}
function id(){return crypto.randomUUID()}
function auth(req,res,next){if(!req.session.user)return res.status(401).json({error:"Connexion requise"});next()}
function teacher(req,res,next){if(!req.session.user||req.session.user.role!=="teacher")return res.status(403).json({error:"Accès enseignant requis"});next()}
app.get("/health",(_q,r)=>r.json({status:"ok",app:"portfolio-deust-apn"}));
app.post("/api/login",async(req,res)=>{const {role,username,password,studentId,code}=req.body||{};if(role==="teacher"){if(username===process.env.ADMIN_USER&&password===process.env.ADMIN_PASSWORD){req.session.user={role:"teacher",name:"Espace enseignant"};return res.json({ok:true,user:req.session.user})}return res.status(401).json({error:"Identifiants enseignants incorrects."})}
if(role==="student"){const row=await db.execute({sql:"select * from students where id=?",args:[studentId]});const s=row.rows[0];if(s&&await bcrypt.compare(code||"",s.access_hash)){req.session.user={role:"student",studentId:s.id,name:s.name,promo:s.promo};return res.json({ok:true,user:req.session.user})}return res.status(401).json({error:"Identifiant étudiant ou code incorrect."})}res.status(400).json({error:"Type de connexion invalide."})});
app.post("/api/logout",(q,r)=>q.session.destroy(()=>r.json({ok:true})));
app.get("/api/me",auth,(q,r)=>r.json(q.session.user));
app.get("/api/students",teacher,async(q,r)=>{const x=await db.execute("select id,name,email,promo,created_at from students order by promo,name");r.json(x.rows)});
app.post("/api/students",teacher,async(q,r)=>{const {name,email,promo}=q.body||{};if(!name||!["D1","D2"].includes(promo))return r.status(400).json({error:"Nom et promotion D1/D2 obligatoires."});const studentId=id(),code=String(crypto.randomInt(100000,999999)),hash=await bcrypt.hash(code,10);await db.execute({sql:"insert into students(id,name,email,promo,access_hash) values(?,?,?,?,?)",args:[studentId,name,email||null,promo,hash]});r.json({id:studentId,name,email,promo,code})});
function scope(req){return req.session.user.role==="teacher"?null:req.session.user.studentId}
app.get("/api/portfolio/:studentId",auth,async(q,r)=>{const sid=q.params.studentId;if(scope(q)&&scope(q)!==sid)return r.sendStatus(403);const [s,i,e,v]=await Promise.all([db.execute({sql:"select id,name,email,promo from students where id=?",args:[sid]}),db.execute({sql:"select * from internships where student_id=? order by created_at desc",args:[sid]}),db.execute({sql:"select * from experiences where student_id=? order by entry_date desc",args:[sid]}),db.execute({sql:"select * from evaluations where student_id=? order by entry_date desc",args:[sid]})]);r.json({student:s.rows[0],internships:i.rows,experiences:e.rows,evaluations:v.rows,competencies,levels,activities})});
app.post("/api/internships",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {year,kind,organization,expected_hours,start_date,end_date}=q.body;if(!sid||!organization)return r.status(400).json({error:"Données incomplètes"});if(scope(q)&&q.body.studentId&&q.body.studentId!==sid)return r.sendStatus(403);const internshipId=id();await db.execute({sql:"insert into internships(id,student_id,year,kind,organization,expected_hours,start_date,end_date) values(?,?,?,?,?,?,?,?)",args:[internshipId,sid,year,kind,organization,expected_hours||0,start_date||null,end_date||null]});r.json({id:internshipId})});
app.post("/api/experiences",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {activity,entry_date,hours,mission,reflection,internship_id}=q.body;if(!sid||!activity||!entry_date||!mission)return r.status(400).json({error:"Date, activité et mission obligatoires"});const eid=id();await db.execute({sql:"insert into experiences(id,student_id,internship_id,activity,entry_date,hours,mission,reflection) values(?,?,?,?,?,?,?,?)",args:[eid,sid,internship_id||null,activity,entry_date,hours||0,mission,reflection||null]});r.json({id:eid})});
app.post("/api/evaluations",auth,async(q,r)=>{const sid=scope(q)||q.body.studentId;const {competency_id,level,comment}=q.body;if(!sid||!competencies.some(c=>c.id===competency_id)||!levels.includes(level))return r.status(400).json({error:"Évaluation invalide"});const eid=id();await db.execute({sql:"insert into evaluations(id,student_id,competency_id,level,author,comment) values(?,?,?,?,?,?)",args:[eid,sid,competency_id,level,q.session.user.role,comment||null]});r.json({id:eid})});
app.get("/api/teacher/portfolio/:studentId",teacher,async(q,r)=>{const sid=q.params.studentId;const [s,i,e,v]=await Promise.all([db.execute({sql:"select id,name,email,promo from students where id=?",args:[sid]}),db.execute({sql:"select * from internships where student_id=? order by created_at desc",args:[sid]}),db.execute({sql:"select * from experiences where student_id=? order by entry_date desc",args:[sid]}),db.execute({sql:"select * from evaluations where student_id=? order by entry_date desc",args:[sid]})]);r.json({student:s.rows[0],internships:i.rows,experiences:e.rows,evaluations:v.rows,competencies,levels,activities})});
app.use(express.static(path.join(__dirname,"public")));
app.get("*",(_q,r)=>r.sendFile(path.join(__dirname,"public","index.html")));
(async()=>{try{if(process.env.TURSO_DATABASE_URL)await initDb();app.listen(PORT,()=>console.log("DEUST APN listening on "+PORT));}catch(e){console.error(e);process.exit(1)}})();