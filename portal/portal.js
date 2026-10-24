let token=localStorage.getItem("mtToken")||"", me=null;
const $=s=>document.querySelector(s), E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

async function api(path,opt={}){
  const headers={...(opt.headers||{}),"Content-Type":"application/json"};
  if(token)headers.Authorization=`Bearer ${token}`;
  const r=await fetch(path,{...opt,headers});
  const b=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(b.error||r.status);
  return b
}
async function login(email,password){const r=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});token=r.token;localStorage.setItem("mtToken",token);me=r.user}
async function boot(){try{me=await api("/api/auth/me");showApp();await render()}catch{showLogin()}}
function showLogin(){$("#loginView").hidden=false;$("#appView").hidden=true}
function showApp(){$("#loginView").hidden=true;$("#appView").hidden=false;$("#roleLabel").textContent=`${me.name} • ${me.role}`}

$("#loginForm").onsubmit=async e=>{e.preventDefault();try{await login($("#loginEmail").value,$("#loginPassword").value);showApp();await render()}catch(err){$("#loginError").textContent=err.message}}
$("#logoutBtn").onclick=()=>{localStorage.removeItem("mtToken");token="";me=null;showLogin()}

document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=async()=>{
  document.querySelectorAll("[data-tab]").forEach(x=>x.classList.remove("is-active"));
  b.classList.add("is-active");
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("is-active"));
  $("#tab-"+b.dataset.tab).classList.add("is-active");
  $("#tabTitle").textContent=b.textContent.replace(/^\W+/,"");
  await render()
})

async function render(){
 const health=await api("/api/health");$("#healthBadge").innerHTML=`<span class=good>● ONLINE ${E(health.version)}</span>`;
 const cases=await api("/api/cases");
 let users=[];try{users=await api("/api/users")}catch{}
 
 $("#metrics").innerHTML=[["Cases",cases.length],["Users",users.length]].map(([n,v])=>`<div class=metric><div>${n}</div><b>${v}</b></div>`).join("");
 $("#recentCases").innerHTML=cases.slice(0,8).map(c=>rowCase(c)).join("")||"<div class=muted>No cases.</div>";
 $("#casesTable").innerHTML=cases.map(c=>rowCase(c)).join("")||"<div class=muted>No cases.</div>";
 $("#usersTable").innerHTML=users.map(u=>`<div class=row><b>${E(u.name)}</b><span class=tag>${E(u.role)}</span><div class=muted>${E(u.email)}</div></div>`).join("")||"<div class=muted>Users require admin role.</div>";
}
function rowCase(c){return `<div class=row><b>${E(c.title)}</b><span class=tag>${E(c.status)}</span><div class=muted>${E(c.priority)} • ${E(c.caseType)} • ${E(c.createdAt)}</div></div>`}

function modal(title,html,onSave){
  $("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;
  $("#portalModal").classList.add("is-open");
  $("#modalCancel").onclick=()=>$("#portalModal").classList.remove("is-open");
  $("#modalSubmit").onclick=async()=>{await onSave();$("#portalModal").classList.remove("is-open");await render()}

    function showLogin(){
        $("#loginView").hidden = false;
        $("#loginView").style.display = "grid";
        $("#appView").hidden = true;
        $("#appView").style.display = "none";
    }
    function showApp(){
        $("#loginView").hidden = true;
        $("#loginView").style.display = "none";
        $("#appView").hidden = false;
        $("#appView").style.display = "grid";
    }
}

$("#newCaseBtn").onclick=()=>modal("Create Case",`<label>Title / claim</label><input id=mTitle><label>Type</label><select id=mType><option>general</option><option>identity</option><option>misattribution</option><option>biography</option></select><label>Priority</label><select id=mPriority><option>low</option><option selected>medium</option><option>high</option></select>`,async()=>api("/api/cases",{method:"POST",body:JSON.stringify({title:$("#mTitle").value,query:$("#mTitle").value,caseType:$("#mType").value,priority:$("#mPriority").value})}));

$("#newUserBtn").onclick=()=>modal("Add User",`<label>Name</label><input id=uname><label>Email</label><input id=uEmail><label>Password</label><input id=uPassword type=password><label>Role</label><select id=uRole><option>viewer</option><option>reporter</option><option>auditor</option><option>investigator</option><option>judge</option><option>admin</option></select>`,async()=>api("/api/users",{method:"POST",body:JSON.stringify({name:$("#uName").value,email:$("#uEmail").value,password:$("#uPassword").value,role:$("#uRole").value})}));

boot();