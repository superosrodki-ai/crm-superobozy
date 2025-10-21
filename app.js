// === NOWY KONTAKT (reservation.html) ===
(function(){
  const form = document.getElementById("contact-form");
  if(!form) return;

  const cfg = window.CONFIG || { SUPABASE_URL:"", SUPABASE_ANON_KEY:"" };
  const connected = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  const client = connected ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  // przełączanie „pigułek” campów
  document.querySelectorAll("#camps .pill").forEach(p=>{
    p.addEventListener("click", ()=> p.classList.toggle("active"));
  });

  async function saveContact(openWhatsApp){
    const fd = new FormData(form);
    const camps = Array.from(document.querySelectorAll("#camps .pill.active")).map(x=>x.dataset.v);

    const payload = {
      source: fd.get("source") || null,
      owner: fd.get("owner") || null,
      club: fd.get("club") || null,
      person: fd.get("person") || null,
      phone: fd.get("phone") || null,
      email: fd.get("email") || null,
      discipline: fd.get("discipline") || null,
      participants: Number(fd.get("participants")||0),
      facilities: fd.get("facilities") || null,
      date_window: fd.get("date_window") || null,
      pref_location: fd.get("pref_location") || null,
      camps,
      notes: fd.get("notes") || null,
      follow_up_days: Number(fd.get("follow_up")||0),
      created_at: new Date().toISOString()
    };

    // DEMO bez kluczy – tylko pokaż komunikat i ewentualnie otwórz WA
    if(!client){
      alert("DEMO: brak zapisu do bazy (uzupełnij config.js).");
      if(openWhatsApp) openWa(payload);
      return;
    }

    try{
      const { data, error } = await client.from("leads").insert(payload).select().single();
      if(error) throw error;
      alert("Kontakt zapisany ✅");
      if(openWhatsApp) openWa(payload);
      form.reset();
      document.querySelectorAll("#camps .pill.active").forEach(p=>p.classList.remove("active"));
    }catch(e){
      alert("Błąd zapisu: " + e.message);
    }
  }

  function openWa(p){
    const msg = `Dzień dobry! Tu SuperObozy.\n` +
      `Otrzymaliśmy zapytanie od: ${p.club||"-"} (${p.person||"-"}).\n` +
      `Uczestników: ${p.participants||"-"}, termin: ${p.date_window||"-"}.\n` +
      `Jak mogę pomóc?`;
    const url = "https://wa.me/?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
  }

  document.getElementById("save-only").addEventListener("click", (e)=>{ e.preventDefault(); saveContact(false); });
  document.getElementById("save-and-wa").addEventListener("click", (e)=>{ e.preventDefault(); saveContact(true); });
})();
// === NOWY KONTAKT (contact.html) ===
(function(){
  const form = document.getElementById("contact-form");
  if(!form) return;

  // "pigułki" campów
  document.querySelectorAll("#camps .pill").forEach(p => {
    p.addEventListener("click", ()=> p.classList.toggle("active"));
  });

  const cfg = window.CONFIG || { SUPABASE_URL:"", SUPABASE_ANON_KEY:"" };
  const connected = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  const client = connected ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  function readPayload(){
    const fd = new FormData(form);
    const camps = Array.from(document.querySelectorAll("#camps .pill.active")).map(x=>x.dataset.v);
    return {
      source: fd.get("source") || null,
      owner: fd.get("owner") || null,
      club: fd.get("club") || null,
      person: fd.get("person") || null,
      phone: fd.get("phone") || null,
      email: fd.get("email") || null,
      discipline: fd.get("discipline") || null,
      participants: Number(fd.get("participants")||0),
      facilities: fd.get("facilities") || null,
      date_window: fd.get("date_window") || null,
      pref_location: fd.get("pref_location") || null,
      camps,
      notes: fd.get("notes") || null,
      follow_up_days: Number(fd.get("follow_up")||0),
      created_at: new Date().toISOString()
    };
  }

  async function save(openWa){
    const payload = readPayload();

    if(!client){
      alert("DEMO: brak kluczy w config.js – zapis do bazy pominięty.");
      if(openWa) openWhatsApp(payload);
      return;
    }

    try{
      const { error } = await client.from("leads").insert(payload);
      if(error) throw error;
      alert("Kontakt zapisany ✅");
      if(openWa) openWhatsApp(payload);
      form.reset();
      document.querySelectorAll("#camps .pill.active").forEach(p=>p.classList.remove("active"));
    }catch(e){
      alert("Błąd zapisu: " + e.message);
    }
  }

  function openWhatsApp(p){
    const msg = `Dzień dobry! Tu SuperObozy.\n` +
      `Otrzymaliśmy zapytanie od: ${p.club||"-"} (${p.person||"-"}).\n` +
      `Uczestników: ${p.participants||"-"}, termin: ${p.date_window||"-"}.\n` +
      `Jak mogę pomóc?`;
    window.open("https://wa.me/?text="+encodeURIComponent(msg), "_blank");
  }

  document.getElementById("save-only").addEventListener("click", e => { e.preventDefault(); save(false); });
  document.getElementById("save-and-wa").addEventListener("click", e => { e.preventDefault(); save(true); });
})();

