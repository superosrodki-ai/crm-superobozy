(function () {
  const hasConfig = typeof SUPABASE_URL === "string" && SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY;
  const supabase = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const DEMO_LEADS="superobozy_demo_leads";
  const DEMO_FUPS="superobozy_demo_followups";

  const el=(id)=>document.getElementById(id);
  const overdueEl=el("overdue"), todayEl=el("today"), nextEl=el("next");
  const cOver=el("c-over"), cToday=el("c-today"), cNext=el("c-next");

  let leadsIndex={};

  async function load(){
    let fups=[], leads=[];
    if(hasConfig){
      const {data:L}=await supabase.from("leads").select("id,club,person,owner,phone,email");
      leads=L||[];
      const {data:F}=await supabase.from("followups").select("*").eq("status","open").order("due_at",{ascending:true}).limit(2000);
      fups=F||[];
    }else{
      leads=JSON.parse(localStorage.getItem(DEMO_LEADS)||"[]");
      fups=JSON.parse(localStorage.getItem(DEMO_FUPS)||"[]").filter(x=>x.status==="open");
    }
    leadsIndex=Object.fromEntries((leads||[]).map(l=>[String(l.id),l]));
    render(fups);
  }

  function render(fups){
    const now=new Date(); now.setSeconds(0,0);
    const todayStart=new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd=new Date(todayStart); todayEnd.setDate(todayEnd.getDate()+1);

    const over=[], today=[], next=[];
    fups.forEach(f=>{ const d=new Date(f.due_at); if(d<todayStart) over.push(f); else if(d>=todayStart && d<todayEnd) today.push(f); else next.push(f); });

    cOver.textContent=String(over.length); cToday.textContent=String(today.length); cNext.textContent=String(next.length);
    overdueEl.innerHTML=over.map(row).join(""); todayEl.innerHTML=today.map(row).join(""); nextEl.innerHTML=next.map(row).join("");
  }

  function row(f){
    const l=leadsIndex[String(f.lead_id)]||{};
    const who=[l.club||"",l.person||""].filter(Boolean).join(" • ");
    const contact=[l.email||"",l.phone||""].filter(Boolean).join(" · ");
    return `<div class="item" data-id="${f.id}">
      <div><div><strong>${who||("Lead #"+f.lead_id)}</strong></div><div class="muted mono" style="font-size:.85rem">${contact}</div><div class="muted" style="font-size:.85rem">${f.note||""}</div></div>
      <div class="nowrap mono"><div>${new Date(f.due_at).toLocaleString("pl-PL")}</div><div style="text-align:right;margin-top:6px"><button class="btn btn-green done">✔ zrobione</button></div></div>
    </div>`;
  }

  document.addEventListener("click", async (e)=>{
    const btn=e.target.closest(".done"); if(!btn) return;
    const item=e.target.closest(".item"); const id=item?.getAttribute("data-id"); if(!id) return;
    if(hasConfig){ await supabase.from("followups").update({status:"done"}).eq("id",id); }
    else{
      const all=JSON.parse(localStorage.getItem(DEMO_FUPS)||"[]");
      const i=all.findIndex(x=>String(x.id)===String(id)); if(i>=0){ all[i].status="done"; localStorage.setItem(DEMO_FUPS,JSON.stringify(all)); }
    }
    load();
  });

  load();
})();