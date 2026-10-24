const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));

async function S(){return chrome.storage.local.get({cases:[],evidenceLedger:[],auditChain:[]})}

async function render(){
 const s=await S();
 
 $('queue').innerHTML=s.cases.length?s.cases.map(c=>`
  <div class="row">
    <b>${E(c.query)}</b><br>
    <small>${E(c.status)} • evidence ${c.evidenceIds?.length||0}</small><br>
    <button class="action primary" data-approve="${c.id}">Approve</button>
    <button class="action" data-more="${c.id}">Need evidence</button>
    <button class="action danger" data-reject="${c.id}">Reject</button>
  </div>`).join(''):'<div>No cases.</div>';
  
 $('audit').innerHTML=s.auditChain.length?s.auditChain.slice().reverse().map(a=>`
  <div class="row">
    <b>${E(a.action)}</b><br>
    <small>${E(a.timestamp)}</small><br>
    <code>${E(a.hash)}</code>
  </div>`).join(''):'<div>No audit events.</div>';

 document.querySelectorAll("[data-approve]").forEach(b=>b.onclick=()=>judge(b.dataset.approve,"approve"));
 document.querySelectorAll("[data-more]").forEach(b=>b.onclick=()=>judge(b.dataset.more,"needs_more_evidence"));
 document.querySelectorAll("[data-reject]").forEach(b=>b.onclick=()=>judge(b.dataset.reject,"reject"));
}

async function judge(id,decision){
 const confidence=Number(prompt("Remedy confidence 0-100",decision==="approve"?85:60)||0);
 const note=prompt("Judge note","Reviewed.")||"";
 await chrome.runtime.sendMessage({type:"JUDGE_CASE",caseId:id,decision,confidence,note});
 render();
}
render();