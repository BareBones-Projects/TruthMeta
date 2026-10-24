import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {db} from "./db.mjs";

const __dirname=path.dirname(fileURLToPath(import.meta.url)),publicDir=__dirname,port=Number(process.env.PORT||8787),bind=process.env.BIND||"127.0.0.1";
const email=process.env.METATRUTH_ADMIN_EMAIL||"admin@metatruth.local",pass=process.env.METATRUTH_ADMIN_PASSWORD||"ChangeMe!123";
const roles={viewer:1,reporter:2,auditor:2,investigator:3,judge:4,admin:5,owner:6};
const id=p=>`${p}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
const pw=p=>crypto.scryptSync(String(p),"metatruth-v010",64).toString("hex");
const sha=s=>crypto.createHash("sha256").update(String(s)).digest("hex");
const now=()=>new Date().toISOString();
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS"};

function send(r,s,b,t="application/json; charset=utf-8"){r.writeHead(s,{...cors,"Content-Type":t});r.end(typeof b==="string"?b:JSON.stringify(b))}
function body(q){return new Promise((a,b)=>{let d="";q.on("data",c=>d+=c);q.on("end",()=>{try{a(d?JSON.parse(d):{})}catch(e){b(e)}});q.on("error",b)})}
function can(u,r){return u&&roles[u.role]>=roles[r]}
function audit(action,u,payload={}){const p=db.prepare("SELECT hash FROM audit ORDER BY rowid DESC LIMIT 1").get(),ts=now(),h=sha(JSON.stringify({action,userId:u?.id||null,payload,ts,previousHash:p?.hash||null}));db.prepare("INSERT INTO audit VALUES(?,?,?,?,?,?,?)").run(id("aud"),ts,action,u?.id||null,JSON.stringify(payload),p?.hash||null,h)}
function pub(u){return u&&{id:u.id,email:u.email,role:u.role,name:u.name,active:!!u.active,createdAt:u.created_at}}
function token(u){const raw=crypto.randomBytes(32).toString("base64url"),exp=new Date(Date.now()+8*3600000).toISOString();db.prepare("INSERT INTO sessions VALUES(?,?,?,?,?,?)").run(id("ses"),u.id,sha(raw),exp,null,now());return{token:raw,expiresAt:exp}}
function auth(q){const h=q.headers.authorization||"";if(!h.startsWith("Bearer "))return null;const s=db.prepare("SELECT * FROM sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?").get(sha(h.slice(7)),now());return s?pub(db.prepare("SELECT * FROM users WHERE id=? AND active=1").get(s.user_id)):null}

if(!db.prepare("SELECT id FROM users LIMIT 1").get())db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?,?)").run(id("usr"),email,pw(pass),"owner","MetaTruth Owner",1,now());

const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8"};

http.createServer(async(q,r)=>{
  if(q.method==="OPTIONS")return send(r,204,"","text/plain");
  const u=new URL(q.url,`http://${q.headers.host||"localhost"}`);
  if(u.pathname==="/api/health")return send(r,200,{ok:true,version:"0.10.0-alpha",database:"sqlite"});
  
  if(u.pathname==="/api/auth/login"&&q.method==="POST"){
    const b=await body(q),row=db.prepare("SELECT * FROM users WHERE lower(email)=lower(?) AND active=1").get(String(b.email||""));
    if(!row||row.password_hash!==pw(b.password||""))return send(r,401,{error:"invalid_credentials"});
    const usr=pub(row),s=token(usr);audit("LOGIN_SUCCESS",usr,{});return send(r,200,{...s,user:usr})
  }
  
  const usr=auth(q);
  if(u.pathname==="/api/auth/me")return usr?send(r,200,usr):send(r,401,{error:"unauthorized"});
  
  if(u.pathname==="/api/cases"&&q.method==="GET"){if(!can(usr,"viewer"))return send(r,401,{error:"unauthorized"});return send(r,200,db.prepare("SELECT * FROM cases ORDER BY created_at DESC").all())}
  
  if(u.pathname==="/api/cases"&&q.method==="POST"){
    if(!can(usr,"investigator"))return send(r,403,{error:"forbidden"});
    const b=await body(q),c={id:id("case"),title:b.title||b.query||"Untitled",query:b.query||b.title||"",case_type:b.caseType||"general",priority:b.priority||"medium",status:"OPEN",created_by:usr.id,created_at:now(),updated_at:now()};
    db.prepare("INSERT INTO cases(id,title,query,case_type,priority,status,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").run(c.id,c.title,c.query,c.case_type,c.priority,c.status,c.created_by,c.created_at,c.updated_at);
    audit("CASE_CREATED",usr,{caseId:c.id});return send(r,201,c)
  }
  
  let m=u.pathname.match(/^\/api\/cases\/([^/]+)\/evidence$/);
  if(m&&q.method==="POST"){
    if(!can(usr,"investigator"))return send(r,403,{error:"forbidden"});
    const cid=decodeURIComponent(m[1]),b=await body(q),e={id:id("ev"),case_id:cid,title:b.title||"Evidence",source_url:b.sourceUrl||"",excerpt:b.excerpt||"",captured_at:b.capturedAt||now(),content_hash:b.contentHash||"",status:b.status||"UNREVIEWED",retrieval:b.retrieval||"manual",created_by:usr.id,created_at:now()};
    db.prepare("INSERT INTO evidence VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(...Object.values(e));audit("EVIDENCE_ADDED",usr,{caseId:cid,evidenceId:e.id});return send(r,201,e)
  }
  
  if(u.pathname==="/api/users"&&q.method==="GET"){if(!can(usr,"admin"))return send(r,403,{error:"admin_role_required"});return send(r,200,db.prepare("SELECT id,email,role,name,active,created_at FROM users").all())}
  
  if(u.pathname==="/api/users"&&q.method==="POST"){
    if(!can(usr,"admin"))return send(r,403,{error:"admin_role_required"});
    const b=await body(q);if(!b.email||!b.password||!b.role)return send(r,400,{error:"missing_fields"});
    if(!roles[b.role])return send(r,400,{error:"invalid_role"});
    const existing=db.prepare("SELECT id FROM users WHERE lower(email)=lower(?)").get(b.email);if(existing)return send(r,409,{error:"email_already_exists"});
    const newUser={id:id("usr"),email:b.email,password_hash:pw(b.password),role:b.role,name:b.name||b.email.split("@")[0],active:1,created_at:now()};
    db.prepare("INSERT INTO users(id,email,password_hash,role,name,active,created_at) VALUES(?,?,?,?,?,?,?)").run(newUser.id,newUser.email,newUser.password_hash,newUser.role,newUser.name,newUser.active,newUser.created_at);
    audit("USER_CREATED",usr,{newUserId:newUser.id,role:newUser.role});return send(r,201,pub(newUser))
  }

  let rel=u.pathname==="/"?"index.html":u.pathname.replace(/^\/+/,""),file=path.normalize(path.join(publicDir,rel));
  if(!file.startsWith(publicDir))return send(r,403,{error:"forbidden"});
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory())return send(r,404,{error:"not_found"});
  r.writeHead(200,{...cors,"Content-Type":mime[path.extname(file).toLowerCase()]||"application/octet-stream"});fs.createReadStream(file).pipe(r)
}).listen(port,bind,()=>console.log(`MetaTruth v0.10.0-alpha http://${bind}:${port}`));