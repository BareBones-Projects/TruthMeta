const D={cases:[],evidenceLedger:[],snapshots:[],deployments:[],auditChain:[],appeals:[],reports:[]};
async function S(){return chrome.storage.local.get(D)}
async function H(t){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t||""));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}

async function audit(action,payload={}){
  const s=await S(),p=s.auditChain.at(-1),timestamp=new Date().toISOString();
  const hash=await H(JSON.stringify({action,payload,timestamp,previousHash:p?.hash||null}));
  s.auditChain.push({id:crypto.randomUUID(),timestamp,action,payload,previousHash:p?.hash||null,hash});
  await chrome.storage.local.set(s);
}

chrome.runtime.onInstalled.addListener(async()=>{const s=await S();await chrome.storage.local.set(s);await audit("EXTENSION_INSTALLED",{version:"0.10.0"})});

chrome.runtime.onMessage.addListener((m,sender,reply)=>{
(async()=>{
  const st=await S();
  if(m.type==="CREATE_CASE"){
    const c={id:crypto.randomUUID(),createdAt:new Date().toISOString(),query:m.query||"",status:"REVIEW_REQUIRED",confidence:0,evidenceIds:[],appealIds:[],decision:null};
    st.cases.push(c);await chrome.storage.local.set(st);await audit("CASE_CREATED",{caseId:c.id});return reply(c);
  }
  if(m.type==="JUDGE_CASE"){
    const c=st.cases.find(x=>x.id===m.caseId);if(!c)return reply({error:"case_not_found"});
    const d=["approve","reject","needs_more_evidence"].includes(m.decision)?m.decision:"needs_more_evidence";
    c.status=d==="approve"?"APPROVED_FOR_AUDIT":d==="reject"?"REJECTED":"REVIEW_REQUIRED";
    c.confidence=Math.max(0,Math.min(100,Number(m.confidence)||0));
    c.decision={by:"Remedy",at:new Date().toISOString(),decision:d,note:m.note||""};
    await chrome.storage.local.set(st);await audit("JUDGE_DECISION",{caseId:c.id,decision:d});return reply(c);
  }
  if(m.type==="GET_STATE")return reply(st);
})().catch(e=>reply({error:String(e)}));
return true;
});