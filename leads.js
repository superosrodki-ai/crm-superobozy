(function () {
  const hasConfig = typeof SUPABASE_URL === "string" && SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY;
  const supabase = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const el = (id)=>document.getElementById(id);
  const rowsEl=el("rows"), qEl=el("q"), fStatus=el("f-status"), fOwner=el("f-owner"), btnExport=el("btn-export");

  const DEMO_LEADS="superobozy_demo_leads";
  let data=[]; let view=[]; let sort={by:"created_at",dir:"desc"};

  function fmt(iso){ if(!iso) return ""; try{ const d=new Date(iso); return d.toLocaleDateString("pl-PL",{year:"numeric",month:"2-digit",day:"2-digit"});}catch{return iso;} }
  const labels={nowy:"Nowy",w_trakcie:"W trakcie",oferta_wyslana:"Oferta wysłana",umowa:"Umowa",utracony:"Utracony"};
  const order=["nowy","w_trakcie","oferta_wyslana","umowa","utracony"];
  const badge=(s)=>`<span class="badge s-${s}">${labels[s]||s}</span>`;

  async function load(){
    if(hasConfig){
      const {data:rows,error}=await supabase.from("leads").select("*").order("created_at",{ascending:false}).limit(2000);
      data=error?[]:(rows||[]);
    }else{
      data=JSON.parse(localStorage.getItem(DEMO_LEADS)||"[]");
    }
    apply();
  }

  function apply(){
    const q=(qEl.value||"").toLowerCase().trim(); const fs=fStatus.value; const fo=fOwner.value;
    view = data.filter(r=>{
      const hay=[r.club||"",r.person||"",r.email||"",r.phone||"",r.owner||""].join(" ").toLowerCase();
      const qOK=!q||hay.includes(q), sOK=!fs||r.status===fs, oOK=!fo||r.owner===fo;
      return qOK && sOK && oOK;
    });

    view.sort((a,b)=>{
      const dir=sort.dir==="asc"?1:-1, x=a[sort.by], y=b[sort.by];
      if(sort.by==="lead_score") return (Number(x||0)-Number(y||0))*dir;
      if(sort.by==="status") return (order.indexOf(x)-order.indexOf(y))*dir;
      if(sort.by==="owner"||sort.by==="club") return String(x||"").localeCompare(String(y||""))*dir;
      return String(x||"").localeCompare(String(y||""))*dir;
    });

    render();
  }

  function render(){
    rowsEl.innerHTML = view.map(r=>{
      const contact=[r.person||"",r.email||"",r.phone||""].filter(Boolean).join(" · ");
      return `<tr data-id="${r.id}">
        <td>${fmt(r.created_at)}</td>
        <td><strong>${r.club||"-"}</strong><div class="muted mono" style="font-size:.8rem">${(r.camps||[]).join(", ")}</div></td>
        <td>${contact||"-"}</td>
        <td>${r.owner||"-"}</td>
        <td class="right mono">${r.lead_score ?? 0}</td>
        <td class="center status-cell">${badge(r.status||"nowy")}</td>
      </tr>`;
    }).join("");
  }

  document.addEventListener("click", async (e)=>{
    const cell=e.target.closest(".status-cell"); if(!cell) return;
    const tr=e.target.closest("tr"); const id=tr?.getAttribute("data-id"); if(!id) return;
    const row=data.find(r=>String(r.id)===String(id)); if(!row) return;
    const arr=["nowy","w_trakcie","oferta_wyslana","umowa","utracony"]; const next=arr[(arr.indexOf(row.status||"nowy")+1)%arr.length];
    row.status=next;
    if(hasConfig){ await supabase.from("leads").update({status:next}).eq("id",id); }
    else{ const all=JSON.parse(localStorage.getItem(DEMO_LEADS)||"[]"); const i=all.findIndex(r=>String(r.id)===String(id)); if(i>=0){ all[i].status=next; localStorage.setItem(DEMO_LEADS,JSON.stringify(all)); } }
    apply();
  });

  document.querySelectorAll("thead th[data-sort]").forEach(th=>{
    th.addEventListener("click",()=>{ const k=th.getAttribute("data-sort"); sort.dir=(sort.by===k?(sort.dir==="asc"?"desc":"asc"):"asc"); sort.by=k; document.querySelectorAll(".sort").forEach(s=>s.textContent=""); const m=document.getElementById("s-"+k); if(m) m.textContent=sort.dir==="asc"?"▲":"▼"; apply(); });
  });
  [qEl,fStatus,fOwner].forEach(i=>i.addEventListener("input",apply));

  btnExport.addEventListener("click",()=>{
    const cols=["id","created_at","club","person","email","phone","owner","lead_score","status"];
    const csv=[cols.join(";")].concat(view.map(r=>cols.map(k=>(Array.isArray(r[k])?r[k].join(", "):(r[k]??"")).toString().replace(/\"/g,'\"\"')).map(v=>`"${v}"`).join(";"))).join("\\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="leads_export.csv"; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  });

  load();
})();