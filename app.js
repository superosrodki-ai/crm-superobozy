/* Aplikacja – proste helpery do Supabase oraz formularze */
(function () {
  const cfg = window.CONFIG || { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };
  const hasKeys = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY;
  const statusEl = document.querySelector("#status .badge");

  let client = null;
  if (hasKeys && window.supabase) {
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      statusEl.textContent = "połączono z Supabase";
      statusEl.className = "badge ok";
    } catch (e) {
      statusEl.textContent = "błąd inicjalizacji";
      statusEl.className = "badge err";
      console.error(e);
    }
  } else {
    if (statusEl) {
      statusEl.textContent = "tryb DEMO (brak kluczy)";
      statusEl.className = "badge neutral";
    }
  }

  // Lista leadów na stronie głównej
  async function renderLeads() {
    const container = document.getElementById("leads");
    if (!container) return;

    if (!client) {
      // DEMO – przykładowe rekordy
      const demo = [
        { id: 1, club: "UKS Orzeł", email: "kontakt@superosrodki.pl", created_at: "2025-10-01" },
        { id: 2, club: "KS Mewa", email: "kontakt@superosrodki.pl", created_at: "2025-10-05" },
      ];
      container.innerHTML = rowsTable(demo, ["id","club","email","created_at"]);
      return;
    }

    try {
      const { data, error } = await client.from("leads").select("*").order("created_at", { ascending: false }).limit(20);
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
    return `<div class="mt" style="overflow:auto"><table class="table">${head}${body}</table></div>`;
  }

  function escapeHtml(str){
    return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  // Obsługa formularza ofert
  const offerForm = document.getElementById("offer-form");
  if (offerForm) {
    offerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = document.getElementById("offer-msg");
      const form = new FormData(offerForm);
      const payload = {
        email: form.get("email"),
        club: form.get("club"),
        content: form.get("content"),
        created_at: new Date().toISOString()
      };

      if (!client) {
        out.textContent = "DEMO: brak zapisu (uzupełnij config.js).";
        return;
        }

      try {
        const { data, error } = await client.from("offers").insert(payload).select();
        if (error) throw error;
        out.textContent = "Zapisano ofertę (Supabase).";
        offerForm.reset();
      } catch (err) {
        out.textContent = "Błąd zapisu: " + err.message;
      }
    });
  }

  // Obsługa formularza rezerwacji
  const resForm = document.getElementById("reservation-form");
  if (resForm) {
    resForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = document.getElementById("reservation-msg");
      const form = new FormData(resForm);
      const payload = {
        contractor: form.get("contractor"),
        email: form.get("email"),
        date_from: form.get("date_from"),
        date_to: form.get("date_to"),
        seats: Number(form.get("seats") || 0),
        rooms: form.get("rooms"),
        created_at: new Date().toISOString()
      };

      if (!client) {
        out.textContent = "DEMO: brak zapisu (uzupełnij config.js).";
        return;
      }

      try {
        const { data, error } = await client.from("reservations").insert(payload).select();
        if (error) throw error;
        out.textContent = "Zapisano rezerwację (Supabase).";
        resForm.reset();
      } catch (err) {
        out.textContent = "Błąd zapisu: " + err.message;
      }
    });
  }

  renderLeads();
})();
