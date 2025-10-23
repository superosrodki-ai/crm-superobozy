/* leads.js – Lista leadów PRO+
   Funkcje:
   - pobieranie z Supabase (albo DEMO z localStorage)
   - wyszukiwanie (na żywo)
   - sortowanie po kolumnach
   - kolorowe statusy + zmiana 1-klik
   - licznik follow-upów 'na dziś'
   - eksport CSV (z uwzględnieniem filtra)
*/

(function () {
  const hasConfig = typeof SUPABASE_URL === "string" && SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY;
  const supabase = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const el = (id) => document.getElementById(id);
  const rowsEl = el("rows");
  const qEl = el("q");
  const fStatus = el("f-status");
  const fOwner = el("f-owner");
  const kpiToday = el("kpi-today");
  const kpiTotal = el("kpi-total");
  const btnExport = el("btn-export");

  const DEMO_KEY = "superobozy_demo_leads";

  let data = [];         // pełne dane
  let view = [];         // po filtrze i sortowaniu
  let sort = { by: "created_at", dir: "desc" }; // domyślnie: najnowsze na górze

  const statusOrder = ["nowy", "w_trakcie", "oferta_wyslana", "umowa", "utracony"];
  const statusLabels = {
    nowy: "Nowy",
    w_trakcie: "W trakcie",
    oferta_wyslana: "Oferta wysłana",
    umowa: "Umowa",
    utracony: "Utracony",
  };

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch { return iso; }
  }

  function badge(status) {
    return `<span class="badge s-${status}">${statusLabels[status] || status}</span>`;
  }

  async function load() {
    if (hasConfig) {
      const { data: rows, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) {
        console.error(error);
        data = [];
      } else {
        data = rows || [];
      }

      // KPI: follow-upy na dziś
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate()+1);
      const { count, error: e2 } = await supabase
        .from("followups")
        .select("*", { count: "exact", head: true })
        .gte("due_at", today.toISOString())
        .lt("due_at", tomorrow.toISOString())
        .eq("status", "open");
      kpiToday.textContent = e2 ? "—" : String(count || 0);
    } else {
      // DEMO
      data = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
      kpiToday.textContent = "—";
    }
    kpiTotal.textContent = String(data.length);
    apply();
  }

  function apply() {
    const q = (qEl.value || "").toLowerCase().trim();
    const fs = fStatus.value;
    const fo = fOwner.value;

    view = data.filter(r => {
      const hay = [
        r.club || "",
        r.person || "",
        r.email || "",
        r.phone || "",
        r.owner || ""
      ].join(" ").toLowerCase();
      const qOk = !q || hay.includes(q);
      const sOk = !fs || (r.status === fs);
      const oOk = !fo || (r.owner === fo);
      return qOk && sOk && oOk;
    });

    view.sort((a,b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const x = a[sort.by], y = b[sort.by];
      if (sort.by === "lead_score") return (Number(x||0) - Number(y||0)) * dir;
      if (sort.by === "status") return (statusOrder.indexOf(x) - statusOrder.indexOf(y)) * dir;
      if (sort.by === "owner" || sort.by === "club") return String(x||"").localeCompare(String(y||"")) * dir;
      // created_at or others fallback
      return String(x||"").localeCompare(String(y||"")) * dir;
    });

    render();
  }

  function render() {
    rowsEl.innerHTML = view.map(r => {
      const contact = [
        r.person || "",
        r.email || "",
        r.phone || ""
      ].filter(Boolean).join(" · ");
      return `<tr data-id="${r.id}">
        <td class="nowrap">${fmtDate(r.created_at)}</td>
        <td>
          <div><strong>${r.club || "-"}</strong></div>
          <div class="muted mono" style="font-size:.8rem">${(r.camps || []).join(", ")}</div>
        </td>
        <td>${contact || "-"}</td>
        <td>${r.owner || "-"}</td>
        <td class="right mono">${r.lead_score ?? 0}</td>
        <td class="center status-cell">${badge(r.status || "nowy")}</td>
      </tr>`;
    }).join("");
  }

  // ====== status toggle (1‑klik) ======
  rowsEl.addEventListener("click", async (e) => {
    const cell = e.target.closest(".status-cell");
    if (!cell) return;
    const tr = e.target.closest("tr");
    const id = tr?.getAttribute("data-id");
    const row = data.find(r => String(r.id) === String(id));
    if (!row) return;
    const next = nextStatus(row.status || "nowy");
    // update local state
    row.status = next;
    // persist
    if (hasConfig) {
      await supabase.from("leads").update({ status: next }).eq("id", id);
    } else {
      // DEMO
      const rows = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
      const i = rows.findIndex(r => String(r.id) == String(id));
      if (i >= 0) { rows[i].status = next; localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); }
    }
    apply();
  });

  function nextStatus(s) {
    const i = statusOrder.indexOf(s);
    if (i < 0 || i === statusOrder.length - 1) return statusOrder[0];
    return statusOrder[i+1];
  }

  // ====== sortowanie po kliknięciu nagłówka ======
  document.querySelectorAll("thead th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (sort.by === key) sort.dir = (sort.dir === "asc" ? "desc" : "asc");
      else { sort.by = key; sort.dir = "asc"; }
      // UI cue
      document.querySelectorAll(".sort").forEach(s => s.textContent = "");
      const mark = document.getElementById("s-" + key);
      if (mark) mark.textContent = sort.dir === "asc" ? "▲" : "▼";
      apply();
    });
  });

  // ====== filtracja live ======
  [qEl, fStatus, fOwner].forEach(i => i.addEventListener("input", apply));

  // ====== eksport CSV ======
  btnExport.addEventListener("click", () => {
    const cols = ["id","created_at","club","person","email","phone","owner","lead_score","status"];
    const csv = [cols.join(";")].concat(
      view.map(r => cols.map(k => (Array.isArray(r[k])? r[k].join(", ") : (r[k] ?? "")).toString().replace(/"/g,'""')).map(v => `"${v}"`).join(";"))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_export.csv";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  });

  // start
  load();
})();