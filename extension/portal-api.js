const MetaPortalAPI = (() => {
  async function cfg() { return chrome.storage.local.get({portalUrl: "http://127.0.0.1:8787",portalToken: "",activeCaseId: ""}); }
  async function request(path, options={}) {
    const c = await cfg();
    const base = String(c.portalUrl || "").replace(/\/+$/, "");
    const headers = {...(options.headers || {}), "Content-Type":"application/json"};
    if (c.portalToken) headers["Authorization"] = `Bearer ${c.portalToken}`;
    const res = await fetch(base + path, {...options, headers});
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).error || ""; } catch {}
      throw new Error(`${res.status}${detail ? ` ${detail}` : ""}`);
    }
    return res.status === 204 ? null : res.json();
  }
  return {
    health:()=>request("/api/health"),
    cases:()=>request("/api/cases"),
    createCase:(body)=>request("/api/cases",{method:"POST",body:JSON.stringify(body)}),
    addEvidence:(caseId,body)=>request(`/api/cases/${encodeURIComponent(caseId)}/evidence`,{method:"POST",body:JSON.stringify(body)}),
    setActiveCase:async(id)=>{await chrome.storage.local.set({activeCaseId:id});return id;},
    getActiveCase:async()=>{const c=await cfg();return c.activeCaseId || "";}
  };
})();