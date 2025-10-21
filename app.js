/* Logika aplikacji (Supabase + tryb DEMO) */
(function () {
  const cfg = window.CONFIG || { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };
  const hasKeys = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY;
  const statusWrap = document.getElementById("status");
  const status = statusWrap ? statusWrap.querySelector(".badge") : null;

  let client = null;
  if (hasKeys && window.supabase) {
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      if (status) { status.textContent = "połączono z Supabase"; status.className = "badge ok"; }
    } catch (e) {
      if (status) { status.textContent = "błąd inicjalizacji"; status.className = "badge err"; }
      console.error(e);
    }
  } else {
    if (status) { status.textContent = "tryb DEMO (brak kluczy)"; status.className = "badge neutral"; }
  }

  async function renderLeads() {
    const container = document.getElementById("leads");
    if (!container) return;

    if (!client) {
      const demo = [
        { id: 1, club: "UKS Orzeł", email: "kontakt@superosrodki.pl", created_at: "2025-10-01" },
        { id: 2, club: "KS Mewa",  email: "kontakt@superosrodki.pl", created_at: "2025-10-05" },
      ];
      container.innerHTML = rowsTable(demo, ["id","club","email","created_at"]);
      return;
    }

    try {
      const { data, error } = await client.from("leads").select("*").order("created_at",{ascending:false}).limit(20);
      if (error) throw error;
      container.innerHTML = rowsTable(data, ["id","club","email","created_at"]);
    } catch (e) {
      container.innerHTML = `<p class="muted">Nie udało się pobrać leadów: ${e.message}</p>`;
    }
  }

  function rowsTable(rows, cols){
    if (!rows || rows.length === 0) return '<p class="muted">Brak danych.</p>';
    const head = `<thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead>`;
    const body = `<tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${escapeHtml(r[c] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<div class="mt" style="overflow:auto"><table>${head}${body}</table></div>`;
  }
  function escapeHtml(str){ return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

  // OFFER form
  const offerForm = document.getElementById("offer-form");
  if (offerForm) {
    offerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = document.getElementById("offer-msg");
      const fd = new FormData(offerForm);
      const payload = {
        email: fd.get("email"),
        club: fd.get("club"),
        content: fd.get("content"),
        created_at: new Date().toISOString()
      };
      if (!client) { out.textContent = "DEMO: brak zapisu (uzupełnij config.js)."; return; }
      try {
        const { error } = await client.from("offers").insert(payload);
        if (error) throw error;
        out.textContent = "Zapisano ofertę.";
        offerForm.reset();
      } catch (err) { out.textContent = "Błąd zapisu: " + err.message; }
    });
  }

  // RESERVATION form
  const resForm = document.getElementById("reservation-form");
  if (resForm) {
    resForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = document.getElementById("reservation-msg");
      const fd = new FormData(resForm);
      const payload = {
        contractor: fd.get("contractor"),
        email: fd.get("email"),
        date_from: fd.get("date_from"),
        date_to: fd.get("date_to"),
        seats: Number(fd.get("seats") || 0),
        rooms: fd.get("rooms"),
        created_at: new Date().toISOString()
      };
      if (!client) { out.textContent = "DEMO: brak zapisu (uzupełnij config.js)."; return; }
      try {
        const { error } = await client.from("reservations").insert(payload);
        if (error) throw error;
        out.textContent = "Zapisano rezerwację.";
        resForm.reset();
      } catch (err) { out.textContent = "Błąd zapisu: " + err.message; }
    });
  }

  renderLeads();
})();
