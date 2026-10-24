const $=s=>document.querySelector(s);
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let activeCaseId="";

async function refresh(){
  try { const health=await MetaPortalAPI.health(); $("#connectionState").innerHTML=`<span style="color:#65e6ba">● Connected</span> ${E(health.version||"")}`; } 
  catch(e) { $("#connectionState").textContent=`Portal unavailable: ${e.message}`; }
  
  const cases=await MetaPortalAPI.cases().catch(()=>[]);
  const c=cases.find(x=>x.id===activeCaseId)||cases[0];
  if(c&&!activeCaseId){activeCaseId=c.id;await MetaPortalAPI.setActiveCase(c.id)}
  $("#caseSummary").innerHTML=c?`<b>${E(c.title||c.query)}</b><div>Status: ${E(c.status)}</div><div>ID: ${E(c.id)}</div>`:"No case selected.";
}

$("#openPortal").onclick=async()=>{const c=await chrome.storage.local.get({portalUrl:"http://127.0.0.1:8787"});chrome.tabs.create({url:c.portalUrl})};
$("#newCase").onclick=async()=>{
  const title=prompt("Case title / claim"); if(!title)return;
  const c=await MetaPortalAPI.createCase({title,query:title,priority:"medium",caseType:"general"});
  activeCaseId=c.id; await MetaPortalAPI.setActiveCase(c.id); await refresh();
};
$("#capturePage").onclick=async()=>{
  if(!activeCaseId)return alert("Create or select a case first.");
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true}); if(!tab?.id)return;
  const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({sourceUrl:location.href,title:document.title,excerpt:(document.body?.innerText||"").replace(/\s+/g," ").trim().slice(0,4000),capturedAt:new Date().toISOString()})});
  const data=new TextEncoder().encode(JSON.stringify(result));const dg=await crypto.subtle.digest("SHA-256",data);const hash=[...new Uint8Array(dg)].map(x=>x.toString(16).padStart(2,"0")).join("");
  await MetaPortalAPI.addEvidence(activeCaseId,{...result,contentHash:hash,status:"UNREVIEWED",retrieval:"explicit-user-capture"});
  alert("Evidence captured and linked.");
  await refresh();
};
refresh();