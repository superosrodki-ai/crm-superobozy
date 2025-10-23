/* app.js – CRM SuperObozy (kontakt) – v2
   - Supabase init z config.js (fallback do DEMO/localStorage gdy pusty)
   - Walidacje + lead score
   - Kontrola duplikatów
   - Zapis leada (+ opcjonalny followup)
   - Szybkie szablony: SMS / e-mail / WhatsApp
*/

(function () {
  // ===== 0) Supabase init / DEMO =====
  const hasConfig = typeof SUPABASE_URL === "string" && SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY;
  const supabase = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  // Mały helper do trybu DEMO
  const DEMO_KEY = "superobozy_demo_leads";
  const demoLoad = () => JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
  const demoSave = (rows) => localStorage.setItem(DEMO_KEY, JSON.stringify(rows));

  // ===== 1) DOM =====
  const el = (id) => document.getElementById(id);
  const form = document.getElementById("contact-form");
  const meta = document.getElementById("contact-meta");

  const fields = {
    source: el("source"),
    owner: el("owner"),
    club: el("club"),
    person: el("person"),
    phone: el("phone"),
    email: el("email"),
    discipline: el("discipline"),
    participants: el("participants"),
    facilities: el("facilities"),
    date_window: el("date_window"),
    pref_location: el("pref_location"),
    status: el("status"),
    priority: el("priority"),
    notes: el("notes"),
    follow_up: el("follow_up"),
    consent: el("consent"),
  };

  const ui = {
    score: el("lead-score"),
    dup: el("dup-info"),
    fu: el("fu-info"),
    chips: document.getElementById("camps"),
    preview: el("preview"),
    btnSave: document.getElementById("save-only"),
    btnSaveWA: document.getElementById("save-and-wa"),
    btnSms: document.getElementById("btn-sms"),
    btnEmail: document.getElementById("btn-email"),
    btnWa: document.getElementById("btn-wa"),
    btnTemplates: document.getElementById("templates"),
    btnReset: document.getElementById("reset"),
    dlg: document.getElementById("dlg"),
    tplSms: document.getElementById("tpl-sms"),
    tplMailSubj: document.getElementById("tpl-mail-subj"),
    tplMailBody: document.getElementById("tpl-mail-body"),
    dlgCancel: document.getElementById("dlg-cancel"),
    dlgSave: document.getElementById("dlg-save"),
  };

  // ===== 2) Chips – wybór ośrodków =====
  const selectedCamps = new Set();
  ui.chips.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.classList.contains("chip")) return;
    const v = t.dataset.v;
    t.classList.toggle("active");
    if (t.classList.contains("active")) selectedCamps.add(v);
    else selectedCamps.delete(v);
    recomputeScore();
    renderPreview();
  });

  // ===== 3) Szablony (persist w localStorage) =====
  const TPL_KEY = "superobozy_tpl_v1";
  const loadTpl = () => {
    try {
      const j = JSON.parse(localStorage.getItem(TPL_KEY) || "{}");
      if (j.sms) ui.tplSms.value = j.sms;
      if (j.mailSubj) ui.tplMailSubj.value = j.mailSubj;
      if (j.mailBody) ui.tplMailBody.value = j.mailBody;
    } catch {}
  };
  const saveTpl = () => {
    localStorage.setItem(
      TPL_KEY,
      JSON.stringify({
        sms: ui.tplSms.value,
        mailSubj: ui.tplMailSubj.value,
        mailBody: ui.tplMailBody.value,
      })
    );
  };
  loadTpl();

  ui.btnTemplates.addEventListener("click", () => ui.dlg.showModal());
  ui.dlgCancel.addEventListener("click", () => ui.dlg.close());
  ui.dlgSave.addEventListener("click", () => {
    saveTpl();
    ui.dlg.close();
    renderPreview();
  });

  // ===== 4) Walidacja + lead score =====
  const phoneOk = (s) => !s || /^\+?[0-9\s-]{7,}$/.test((s || "").trim());
  const emailOk = (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());

  function recomputeScore() {
    let sc = 0;
    const n = parseInt(fields.participants.value || "0", 10);
    if (n >= 80) sc += 40;
    else if (n >= 50) sc += 30;
    else if (n >= 30) sc += 20;

    if ((fields.facilities.value || "").toLowerCase().includes("hala")) sc += 10;
    if ((fields.date_window.value || "").match(/[0-9]{1,2}/)) sc += 10;
    if (selectedCamps.size) sc += 5;

    const pr = fields.priority.value;
    if (pr === "Wysoki") sc += 10;

    const src = fields.source.value;
    if (src === "Telefon" || src === "Facebook" || src === "Instagram") sc += 5;

    ui.score.textContent = sc;
    return sc;
  }

  Object.values(fields).forEach((f) => {
    if (!f) return;
    f.addEventListener("input", () => {
      recomputeScore();
      renderPreview();
      updateFollowupInfo();
      checkDuplicatesDebounced();
    });
  });

  // ===== 5) Follow-up opis =====
  function updateFollowupInfo() {
    const days = parseInt(fields.follow_up.value, 10);
    const dt = new Date();
    dt.setDate(dt.getDate() + days);
    const s = dt.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });
    ui.fu.textContent = `za ${days} dni → ${s}`;
  }
  updateFollowupInfo();

  // ===== 6) Duplikaty (Supabase lub DEMO) =====
  let dupTimer = null;
  function debounce(fn, ms) {
    return function () {
      clearTimeout(dupTimer);
      dupTimer = setTimeout(fn, ms);
    };
  }
  const checkDuplicatesDebounced = debounce(checkDuplicates, 350);

  async function checkDuplicates() {
    const email = (fields.email.value || "").trim().toLowerCase();
    const phone = (fields.phone.value || "").replace(/\s|-/g, "");
    const club = (fields.club.value || "").trim();

    if (!email && !phone && !club) {
      ui.dup.textContent = "—";
      ui.dup.className = "mono";
      return;
    }

    if (hasConfig) {
      const or = [];
      if (email) or.push(`email.eq.${email}`);
      if (phone) or.push(`phone.eq.${phone}`);
      if (club) or.push(`club.ilike.${encodeURIComponent(club)}`);
      let q = supabase.from("leads").select("id, club, person, phone, email, status").limit(3);
      if (or.length) q = q.or(or.join(","));
      const { data, error } = await q;
      if (error) {
        ui.dup.textContent = "błąd sprawdzania";
        ui.dup.className = "mono danger";
        return;
      }
      if (data && data.length) {
        ui.dup.innerHTML = data.map(d => `#${d.id} ${d.club} • ${d.person || ""} • ${d.email || d.phone || ""} • ${d.status}`).join("\n");
        ui.dup.className = "mono danger";
      } else {
        ui.dup.textContent = "brak";
        ui.dup.className = "mono ok";
      }
    } else {
      const rows = demoLoad();
      const hits = rows.filter(r =>
        (email && r.email && r.email.toLowerCase() === email) ||
        (phone && r.phone && r.phone.replace(/\s|-/g, "") === phone) ||
        (club && r.club && r.club.toLowerCase() === club.toLowerCase())
      ).slice(0, 3);
      if (hits.length) {
        ui.dup.innerHTML = hits.map(d => `DEMO ${d.club} • ${d.person || ""} • ${d.email || d.phone || ""}`).join("\n");
        ui.dup.className = "mono danger";
      } else {
        ui.dup.textContent = "brak";
        ui.dup.className = "mono ok";
      }
    }
  }

  // ===== 7) Zapis =====
  function payload() {
    return {
      source: fields.source.value,
      owner: fields.owner.value,
      club: (fields.club.value || "").trim(),
      person: (fields.person.value || "").trim(),
      phone: (fields.phone.value || "").trim(),
      email: (fields.email.value || "").trim(),
      discipline: fields.discipline.value,
      participants: fields.participants.value ? parseInt(fields.participants.value, 10) : null,
      facilities: fields.facilities.value,
      date_window: fields.date_window.value,
      pref_location: fields.pref_location.value,
      camps: Array.from(selectedCamps),
      status: fields.status.value,
      priority: fields.priority.value,
      notes: fields.notes.value,
      consent: fields.consent.value,
      lead_score: recomputeScore(),
      created_at: new Date().toISOString(),
    };
  }

  function validate() {
    let ok = true;
    if (!fields.club.value.trim()) ok = false;
    if (fields.phone.value && !phoneOk(fields.phone.value)) ok = false;
    if (fields.email.value && !emailOk(fields.email.value)) ok = false;
    return ok;
  }

  async function saveLead() {
    if (!validate()) {
      alert("Uzupełnij poprawnie: Klub/Szkoła oraz poprawny telefon/e-mail (jeśli podajesz).");
      return { ok: false };
    }

    const body = payload();
    const fuDays = parseInt(fields.follow_up.value, 10);
    const fuAt = new Date(); fuAt.setDate(fuAt.getDate() + fuDays);

    if (hasConfig) {
      // insert lead
      const { data, error } = await supabase.from("leads").insert(body).select("id").single();
      if (error) {
        alert("Błąd zapisu do Supabase: " + error.message);
        return { ok: false };
      }
      const leadId = data.id;

      // insert followup
      await supabase.from("followups").insert({
        lead_id: leadId,
        due_at: fuAt.toISOString(),
        note: "Auto: follow-up po " + fuDays + " dniach",
        status: "open",
      });

      return { ok: true, id: leadId };
    } else {
      // DEMO → localStorage
      const rows = demoLoad();
      rows.push({ id: rows.length + 1, ...body });
      demoSave(rows);
      return { ok: true, id: rows.length };
    }
  }

  // ===== 8) Szybkie wiadomości =====
  function fill(str) {
    const map = {
      "{CLUB}": fields.club.value || "klub/szkoła",
      "{PERSON}": fields.person.value || "Państwo",
      "{PEOPLE}": fields.participants.value || "uczestnicy",
      "{DISCIPLINE}": fields.discipline.value || "dyscyplina",
      "{DATE}": fields.date_window.value || "termin",
    };
    return Object.keys(map).reduce((s, k) => s.split(k).join(map[k]), str);
  }

  function buildSMS() {
    const tpl = ui.tplSms.value;
    return fill(tpl);
  }

  function buildMail() {
    const subj = fill(ui.tplMailSubj.value);
    const body = fill(ui.tplMailBody.value);
    const to = (fields.email.value || "").trim();
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    return { subj, body, to, mailto };
  }

  function buildWA() {
    const text = buildSMS(); // zwykle ten sam krótki tekst
    const phone = (fields.phone.value || "").replace(/\s|-/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    return url;
  }

  function renderPreview() {
    const sms = buildSMS();
    const mail = buildMail();
    ui.preview.textContent =
`SMS/WA:
${sms}

E-mail – TEMAT:
${mail.subj}

E-mail – TREŚĆ:
${mail.body}`;
  }
  renderPreview();

  // ===== 9) Zdarzenia przycisków =====
  ui.btnSave.addEventListener("click", async () => {
    const res = await saveLead();
    if (res.ok) alert("Zapisano kontakt #" + res.id);
  });

  ui.btnSaveWA.addEventListener("click", async () => {
    const res = await saveLead();
    if (res.ok) {
      const wa = buildWA();
      window.open(wa, "_blank");
    }
  });

  ui.btnSms.addEventListener("click", async () => {
    const sms = buildSMS();
    await navigator.clipboard.writeText(sms).catch(()=>{});
    alert("Tekst SMS skopiowany do schowka.");
  });

  ui.btnEmail.addEventListener("click", () => {
    const mail = buildMail();
    window.location.href = mail.mailto;
  });

  ui.btnWa.addEventListener("click", () => {
    const wa = buildWA();
    window.open(wa, "_blank");
  });

  ui.btnReset.addEventListener("click", () => {
    if (!confirm("Wyczyścić formularz?")) return;
    form.reset(); meta.reset();
    selectedCamps.clear();
    Array.from(ui.chips.querySelectorAll(".chip")).forEach(c=>c.classList.remove("active"));
    recomputeScore(); updateFollowupInfo(); ui.dup.textContent = "—"; ui.dup.className="mono";
    renderPreview();
  });

  // Start: policz i sprawdź duplikaty
  recomputeScore();
  checkDuplicates();
})();