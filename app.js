/* app.js – HARD-BIND – działa z ID, data-action lub po tekście na przycisku */
(function () {
  // ---------- SUPABASE / DEMO ----------
  const hasConfig = typeof SUPABASE_URL === "string" && SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY;
  const supabase = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  // ---------- DEMO storage ----------
  const DEMO_LEADS = "superobozy_demo_leads";
  const DEMO_FUPS  = "superobozy_demo_followups";
  const DEMO_LOGS  = "superobozy_demo_logs";
  const demoLoad = (k) => JSON.parse(localStorage.getItem(k) || (k===DEMO_LOGS ? "{}":"[]"));
  const demoSave = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---------- helpers ----------
  const el = (id) => document.getElementById(id);

  // Sprytne wyszukiwanie przycisków (id → data-action → tekst)
  function pickBtn(opts) {
    const { id, action, textIncludes } = opts;
    let b = id && document.getElementById(id);
    if (!b && action) b = document.querySelector(`[data-action="${action}"]`);
    if (!b && textIncludes) {
      const t = textIncludes.toLowerCase();
      b = Array.from(document.querySelectorAll("button, a.btn")).find(x => (x.textContent || "").toLowerCase().includes(t));
    }
    return b || null;
  }
  function normPhone(s){ return (s||"").replace(/\s|-/g,""); }
  const phoneOk = (s) => !s || /^\+?[0-9\s-]{7,}$/.test((s || "").trim());
  const emailOk = (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());

  // ---------- pola ----------
  const fields = {
    source: el("source"), owner: el("owner"),
    club: el("club"), person: el("person"),
    phone: el("phone"), email: el("email"),
    discipline: el("discipline"), participants: el("participants"),
    facilities: el("facilities"), date_window: el("date_window"),
    pref_location: el("pref_location"),
    status: el("status"), priority: el("priority"),
    notes: el("notes"), follow_up: el("follow_up"), consent: el("consent"),
  };
  const chipsEl = document.getElementById("camps");
  const ui = {
    score: el("lead-score"),
    dup: el("dup-info"),
    fu: el("fu-info"),
    preview: document.getElementById("preview"),
    // TU: twarde wyszukiwanie przycisków
    btnSave:   pickBtn({ id:"save-only",    action:"save-only",    textIncludes:"zapisz nowy kontakt" }),
    btnSaveWA: pickBtn({ id:"save-and-wa", action:"save-and-wa",  textIncludes:"whatsapp" }),
    btnSms:    pickBtn({ id:"btn-sms",      action:"sms",          textIncludes:"sms" }),
    btnEmail:  pickBtn({ id:"btn-email",    action:"email",        textIncludes:"e-mail" }),
    btnWa:     pickBtn({ id:"btn-wa",       action:"wa",           textIncludes:"whatsapp" }),
    btnTemplates: pickBtn({ id:"templates", action:"templates",    textIncludes:"szablon" }),
    btnReset:  pickBtn({ id:"reset",        action:"reset",        textIncludes:"wyczyść" }),
    dlg: document.getElementById("dlg"),
    tplSms: document.getElementById("tpl-sms"),
    tplMailSubj: document.getElementById("tpl-mail-subj"),
    tplMailBody: document.getElementById("tpl-mail-body"),
    dlgCancel: document.getElementById("dlg-cancel"),
    dlgSave: document.getElementById("dlg-save"),
  };

  // ---------- chips ----------
  const selectedCamps = new Set();
  if (chipsEl) chipsEl.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList.contains("chip")) return;
    const v = t.dataset.v;
    t.classList.toggle("active");
    if (t.classList.contains("active")) selectedCamps.add(v); else selectedCamps.delete(v);
    recomputeScore(); renderPreview();
  });

  // ---------- templates ----------
  const TPL_KEY = "superobozy_tpl_v1";
  (function loadTpl(){
    try {
      const j = JSON.parse(localStorage.getItem(TPL_KEY) || "{}");
      if (j.sms) ui.tplSms.value = j.sms;
      if (j.mailSubj) ui.tplMailSubj.value = j.mailSubj;
      if (j.mailBody) ui.tplMailBody.value = j.mailBody;
    } catch {}
  })();
  function saveTpl(){
    localStorage.setItem(TPL_KEY, JSON.stringify({
      sms: ui.tplSms?.value || "", mailSubj: ui.tplMailSubj?.value || "", mailBody: ui.tplMailBody?.value || ""
    }));
    logActivity(currentLeadId, "Zapisano szablony wiadomości");
  }

  // ---------- score/dup/follow-up ----------
  function recomputeScore() {
    let sc = 0;
    const n = parseInt(fields.participants?.value || "0", 10);
    if (n >= 80) sc += 40; else if (n >= 50) sc += 30; else if (n >= 30) sc += 20;
    if ((fields.facilities?.value || "").toLowerCase().includes("hala")) sc += 10;
    if ((fields.date_window?.value || "").match(/[0-9]{1,2}/)) sc += 10;
    if (selectedCamps.size) sc += 5;
    if (fields.priority?.value === "Wysoki") sc += 10;
    const src = fields.source?.value;
    if (src === "Telefon" || src === "Facebook" || src === "Instagram") sc += 5;
    if (ui.score) ui.score.textContent = sc;
    return sc;
  }
  function updateFollowupInfo() {
    const days = parseInt(fields.follow_up?.value || "3", 10);
    const dt = new Date(); dt.setDate(dt.getDate() + days);
    if (ui.fu) ui.fu.textContent = `za ${days} dni → ${dt.toLocaleDateString("pl-PL", { year:"numeric", month:"2-digit", day:"2-digit" })}`;
  }
  let dupTimer = null;
  function debounce(fn, ms){ return function(){ clearTimeout(dupTimer); dupTimer=setTimeout(fn,ms);} }
  const checkDuplicatesDebounced = debounce(checkDuplicates, 300);
  async function checkDuplicates() {
    const email = (fields.email?.value || "").trim().toLowerCase();
    const phone = normPhone(fields.phone?.value || "");
    const club  = (fields.club?.value  || "").trim();
    if (!email && !phone && !club) { if(ui.dup){ ui.dup.textContent="—"; ui.dup.className="mono"; } return; }
    if (hasConfig) {
      let q = supabase.from("leads").select("id, club, person, phone, email, status").limit(3);
      const ors = [];
      if (email) ors.push(`email.eq.${email}`);
      if (phone) ors.push(`phone.eq.${phone}`);
      if (club)  ors.push(`club.ilike.${encodeURIComponent(club)}`);
      if (ors.length) q = q.or(ors.join(","));
      const { data, error } = await q;
      if (error) { if(ui.dup){ ui.dup.textContent="błąd sprawdzania"; ui.dup.className="mono danger"; } return; }
      if (data?.length) {
        if(ui.dup) { ui.dup.innerHTML = data.map(d=>`#${d.id} ${d.club} • ${d.person||""} • ${d.email||d.phone||""} • ${d.status}`).join("\n"); ui.dup.className="mono danger"; }
      } else { if(ui.dup){ ui.dup.textContent="brak"; ui.dup.className="mono ok"; } }
    } else {
      const rows = demoLoad(DEMO_LEADS);
      const hits = rows.filter(r =>
        (email && r.email && r.email.toLowerCase() === email) ||
        (phone && r.phone && normPhone(r.phone) === phone) ||
        (club && r.club && r.club.toLowerCase() === club.toLowerCase())
      ).slice(0,3);
      if (hits.length){ if(ui.dup){ ui.dup.innerHTML = hits.map(d=>`DEMO ${d.club} • ${d.person||""} • ${d.email||d.phone||""}`).join("\n"); ui.dup.className="mono danger"; } }
      else { if(ui.dup){ ui.dup.textContent="brak"; ui.dup.className="mono ok"; } }
    }
  }

  // ---------- payload / validate / save ----------
  function payload() {
    return {
      source: fields.source?.value, owner: fields.owner?.value,
      club: (fields.club?.value || "").trim(), person: (fields.person?.value || "").trim(),
      phone: (fields.phone?.value || "").trim(), email: (fields.email?.value || "").trim(),
      discipline: fields.discipline?.value, participants: fields.participants?.value ? parseInt(fields.participants.value,10) : null,
      facilities: fields.facilities?.value, date_window: fields.date_window?.value, pref_location: fields.pref_location?.value,
      camps: Array.from(selectedCamps), status: fields.status?.value, priority: fields.priority?.value, notes: fields.notes?.value, consent: fields.consent?.value,
      lead_score: recomputeScore(), created_at: new Date().toISOString(),
    };
  }
  function validate(){ let ok=true; if(!fields.club?.value?.trim()) ok=false; if(fields.phone?.value && !phoneOk(fields.phone.value)) ok=false; if(fields.email?.value && !emailOk(fields.email.value)) ok=false; return ok; }

  async function saveLead() {
    if (!validate()) { alert("Uzupełnij poprawnie: Klub/Szkoła oraz poprawny telefon/e-mail (jeśli podajesz)."); return { ok:false }; }
    const body = payload();
    const fuDays = parseInt(fields.follow_up?.value || "3", 10);
    const fuAt = new Date(); fuAt.setDate(fuAt.getDate() + fuDays);

    if (hasConfig) {
      const { data, error } = await supabase.from("leads").insert(body).select("id").single();
      if (error) { alert("Błąd zapisu do Supabase: " + error.message); return { ok:false }; }
      const leadId = data.id;
      await supabase.from("followups").insert({ lead_id: leadId, due_at: fuAt.toISOString(), note: "Auto: follow-up po " + fuDays + " dniach", status:"open" }).catch(()=>{});
      try{ await supabase.from("activities").insert({ lead_id: leadId, text: "Utworzono leada (status: " + body.status + ")" }); }catch{}
      currentLeadId = leadId; renderTimeline();
      return { ok:true, id: leadId };
    } else {
      const rows = demoLoa
