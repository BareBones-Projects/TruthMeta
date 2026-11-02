function send(r,s,b,t="application/json; charset=utf-8"){
  r.writeHead(s,{
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type, Authorization",
    "Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS",
    "Content-Type":t
  });
  r.end(typeof b==="string"?b:JSON.stringify(b));
}

function body(q){
  return new Promise((a,b)=>{
    let d="";
    q.on("data",c=>d+=c);
    q.on("end",()=>{
      try{ a(d?JSON.parse(d):{}); }
      catch(e){ b(new Error("Invalid JSON payload")); }
    });
    q.on("error",b);
  });
}
// ADD THIS BLOCK TO server.mjs BEFORE THE /api/audit GET ROUTE
if(u.pathname==="/api/users"&&q.method==="POST"){
  if(!can(usr,"admin"))return send(r,403,{error:"admin_role_required"});
  const b=await body(q);
  if(!b.email||!b.password||!b.role)return send(r,400,{error:"missing_fields"});
  if(!roles[b.role])return send(r,400,{error:"invalid_role"});
  
  const existing=db.prepare("SELECT id FROM users WHERE lower(email)=lower(?)").get(b.email);
  if(existing)return send(r,409,{error:"email_already_exists"});
  
  const newUser={
    id:id("usr"),
    email:b.email,
    password_hash:pw(b.password),
    role:b.role,
    name:b.name||b.email.split("@")[0],
    active:1,
    created_at:now()
  };
  
  db.prepare("INSERT INTO users(id,email,password_hash,role,name,active,created_at) VALUES(?,?,?,?,?,?,?)")
    .run(newUser.id,newUser.email,newUser.password_hash,newUser.role,newUser.name,newUser.active,newUser.created_at);
  
  audit("USER_CREATED",usr,{newUserId:newUser.id,role:newUser.role});
  return send(r,201,pub(newUser));
}
