import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const home=await mkdtemp(path.join(tmpdir(),'metatruth-security-'));
const port=37000+Math.floor(Math.random()*20000);
const base=`http://127.0.0.1:${port}`;
const password='LocalTestSecret-Only-1234567890';
const env={...process.env, PORT:String(port), BIND:'127.0.0.1', METATRUTH_DB_PATH:path.join(home,'test.db'), METATRUTH_ADMIN_PASSWORD:password, METATRUTH_ADMIN_EMAIL:'owner@test.invalid', METATRUTH_ALLOWED_ORIGINS:'chrome-extension://allowedextension'};
const child=spawn(process.execPath,['portal/server.mjs'],{cwd:new URL('..',import.meta.url),env,stdio:'pipe'});
let output='';child.stderr.on('data',c=>{output+=c.toString()});
try{
  let ok=false;
  for(let attempt=0;attempt<80;attempt++){
    if(child.exitCode!==null)throw new Error('Portal exited before readiness: '+output);
    try {const r=await fetch(base+'/api/health');if(r.status===200){ok=true;break}}catch{}
    await delay(50);
  }
  assert.ok(ok,'portal failed to start: '+output);
  await test('wrong Origin is forbidden',async()=>{const r=await fetch(base+'/api/health',{headers:{Origin:'https://untrusted.invalid'}});assert.equal(r.status,403);});
  await test('allowed extension origin receives explicit CORS',async()=>{const r=await fetch(base+'/api/health',{headers:{Origin:'chrome-extension://allowedextension'}});assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'chrome-extension://allowedextension');});
  await test('wrong login does not authenticate',async()=>{const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@test.invalid',password:'wrong'})});assert.equal(r.status,401)});
  await test('configured login succeeds',async()=>{const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@test.invalid',password})});assert.equal(r.status,200);assert.ok((await r.json()).token)});
  await test('missing authorization fails',async()=>{const r=await fetch(base+'/api/auth/me');assert.equal(r.status,401)});
}finally{child.kill();await rm(home,{recursive:true,force:true})}
