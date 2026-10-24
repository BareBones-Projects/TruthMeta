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