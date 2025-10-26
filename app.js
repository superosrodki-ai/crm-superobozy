
// app.js — wspólny kod dla stron (index, contact, leads, reservation)

const CFG = window.CONFIG || { SUPABASE_URL:"", SUPABASE_ANON_KEY:"" };
const HAS_SB = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
const SB = HAS_SB ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

// Utils
function esc(s){ return (s??"").toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function download(filename, text){
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// ========== INDEX DEMO TABLE ==========
(function(){
  const host = document.getElementById("demo-leads");
  if(!host) return;
  async function render(){
    if(!HAS_SB){
      host.innerHTML = `<div style="overflow:auto">
        <table class="table">
          <thead><tr><th>id</th><th>club</th><th>email</th><th>created_at</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>UKS Orzeł</td><td>kontakt@superosrodki.pl</td><td>2025-10-01</td></tr>
            <tr><td>2</td><td>KS Mewa</td><td>biuro@klub.pl</td><td>2025-10-05</td></tr>
          </tbody>
        </table></div>`;
      return;
    }
    const { data, error } = await SB.from("leads").select("*").order("created_at",{ascending:false}).limit(10);
    if(error){ host.innerHTML = `<p class="muted">Błąd: ${esc(error.message)}</p>`; return; }
    host.innerHTML = `<div style="overflow:auto">
      <table class="table">
        <thead><tr><th>Data</th><th>Opiekun</th><th>Źródło</th><th>Klub</th><th>Osoba</th><th>Email</th></tr></thead>
        <tbody>${(data||[]).map(r=>`
          <tr><td>${(r.created_at||"").slice(0,10)}</td><td>${esc(r.owner)}</td><td>${esc(r.source)}</td>
          <td>${esc(r.club)}</td><td>${esc(r.person)}</td><td>${esc(r.email)}</td></tr>`).join("")}
        </tbody></table></div>`;
  }
  render();
})();

// ========== CONTACT: SAVE LEAD ==========
(function(){
  const formMain = document.getElementById("contact-form");
  const formMeta = document.getElementById("contact-meta");
  if(!formMain || !formMeta) return;

  document.querySelectorAll("#camps .pill").forEach(p=>p.addEventListener("click",()=>p.classList.toggle("active")));

  function getPayload(){
    const fd1 = new FormData(formMain);
    const fd2 = new FormData(formMeta);
    const camps = Array.from(document.querySelectorAll("#camps .pill.active")).map(x=>x.dataset.v);
    return {
      source: fd1.get("source") || null, owner: fd1.get("owner") || null,
      club: fd1.get("club") || null, person: fd1.get("person") || null,
      phone: fd1.get("phone") || null, email: fd1.get("email") || null,
      discipline: fd1.get("discipline") || null, participants: Number(fd1.get("participants")||0),
      facilities: fd1.get("facilities") || null, date_window: fd1.get("date_window") || null,
      pref_location: fd1.get("pref_location") || null, camps,
      notes: fd2.get("notes") || null, follow_up_days: Number(fd2.get("follow_up")||0),
      created_at: new Date().toISOString()
    };
  }
  async function save(openWA){
    const payload = getPayload();
    if(!HAS_SB){
      alert("DEMO: brak kluczy w config.js – zapis do bazy pominięty.");
      if(openWA) openWhatsApp(payload);
      return;
    }
    try{
      const { error } = await SB.from("leads").insert(payload);
      if(error) throw error;
      alert("Kontakt zapisany ✅");
      if(openWA) openWhatsApp(payload);
      formMain.reset(); formMeta.reset();
      document.querySelectorAll("#camps .pill.active").forEach(p=>p.classList.remove("active"));
    }catch(e){ alert("Błąd zapisu: " + e.message); }
  }
  function openWhatsApp(p){
    const msg = `Dzień dobry! Tu SuperObozy.\n`+
      `Zapytanie: ${p.club||"-"} (${p.person||"-"}).\n`+
      `Uczestników: ${p.participants||"-"}, termin: ${p.date_window||"-"}.\n`+
      `Jak mogę pomóc?`;
    window.open("https://wa.me/?text="+encodeURIComponent(msg), "_blank");
  }
  document.getElementById("save-only").addEventListener("click", e=>{e.preventDefault();save(false);});
  document.getElementById("save-and-wa").addEventListener("click", e=>{e.preventDefault();save(true);});
})();

// ========== LEADS LIST ==========
(function(){
  const root = document.getElementById("list");
  if(!root) return;

  const qEl = document.getElementById("q");
  const ownerEl = document.getElementById("owner");
  const sourceEl = document.getElementById("source");
  const minpEl = document.getElementById("minp");
  const fromEl = document.getElementById("from");
  const toEl = document.getElementById("to");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const infoEl = document.getElementById("info");

  let page = 0; const SIZE = 25; let lastCount = 0;

  async function load(){
    if(!HAS_SB){
      const demo = [
        {id:1, created_at:"2025-10-01", owner:"Piotr", source:"Telefon", club:"UKS Orzeł", person:"Anna", email:"kontakt@superosrodki.pl", phone:"+48 600 700 800", participants:45},
        {id:2, created_at:"2025-10-05", owner:"Kasia", source:"E-mail", club:"KS Mewa", person:"Tomasz", email:"biuro@klub.pl", phone:"+48 600 700 900", participants:30}
      ];
      lastCount = demo.length;
      renderTable(demo); updatePager(); return;
    }

    let query = SB.from("leads").select("*", { count:"exact" });

    const owner = ownerEl.value || ""; const source = sourceEl.value || "";
    const minp = Number(minpEl.value||0); const q = (qEl.value||"").trim();
    const dFrom = fromEl.value || ""; const dTo = toEl.value || "";

    if(owner) query = query.eq("owner", owner);
    if(source) query = query.eq("source", source);
    if(minp) query = query.gte("participants", minp);
    if(dFrom) query = query.gte("created_at", new Date(dFrom).toISOString());
    if(dTo)   query = query.lte("created_at", new Date(new Date(dTo).getTime()+24*3600*1000-1).toISOString());
    if(q)     query = query.or(`club.ilike.%${q}%,person.ilike.%${q}%,email.ilike.%${q}%`);

    const from = page*SIZE, to = from+SIZE-1;
    const { data, count, error } = await query.order("created_at",{ascending:false}).range(from,to);
    if(error){ root.innerHTML = `<p class="muted">Błąd: ${esc(error.message)}</p>`; return; }
    lastCount = count||0; renderTable(data||[]); updatePager();
  }
  function renderTable(rows){
    if(!rows.length){ root.innerHTML = `<p class="muted">Brak wyników.</p>`; return; }
    const cols = ["created_at","owner","source","club","person","email","phone","participants"];
    const thead = `<thead><tr>${cols.map(c=>`<th>${({"created_at":"Utworzono","owner":"Opiekun","source":"Źródło","club":"Klub","person":"Osoba","email":"E-mail","phone":"Telefon","participants":"Uczestników"}[c]||c)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r=>`
      <tr>
        <td>${(r.created_at||"").slice(0,10)}</td>
        <td>${esc(r.owner)}</td><td>${esc(r.source)}</td><td>${esc(r.club)}</td>
        <td>${esc(r.person)}</td><td>${esc(r.email)}</td><td>${esc(r.phone||"")}</td>
        <td style="text-align:right">${r.participants??""}</td>
      </tr>`).join("")}</tbody>`;
    root.innerHTML = `<div style="overflow:auto"><table class="table">${thead}${tbody}</table></div>`;
  }
  function updatePager(){ const total = Math.max(1, Math.ceil(lastCount/25)); infoEl.textContent = `Strona ${page+1}/${total} • Razem: ${lastCount}`; prevBtn.disabled=page<=0; nextBtn.disabled=page>=total-1; }
  function exportCSV(){
    const rows = root.querySelectorAll("tbody tr"); if(!rows.length){alert("Brak danych.");return;}
    const headers = Array.from(root.querySelectorAll("thead th")).map(th=>th.textContent);
    const lines = [headers.join(";")];
    rows.forEach(tr=>{ const cells = Array.from(tr.querySelectorAll("td")).map(td=>('"'+td.textContent.replaceAll('"','""')+'"')); lines.push(cells.join(";")); });
    download("leads.csv", lines.join("\n"));
  }

  document.getElementById("btn-search").addEventListener("click", ()=>{page=0;load();});
  document.getElementById("btn-clear").addEventListener("click", ()=>{qEl.value="";ownerEl.value="";sourceEl.value="";minpEl.value="";fromEl.value="";toEl.value="";page=0;load();});
  document.getElementById("btn-csv").addEventListener("click", exportCSV);
  document.getElementById("prev").addEventListener("click", ()=>{if(page>0){page--;load();}});
  document.getElementById("next").addEventListener("click", ()=>{page++;load();});
  load();
})();

// ========== RESERVATION DEMO ==========
(function(){
  const btn = document.getElementById("save-res");
  const form = document.getElementById("reservation-form");
  if(!btn || !form) return;
  btn.addEventListener("click", (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    alert("DEMO: zapis symulowany.\n\n" + Array.from(fd.entries()).map(([k,v])=>`${k}: ${v}`).join("\n"));
  });
})();
