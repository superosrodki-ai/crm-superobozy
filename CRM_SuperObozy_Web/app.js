// Prosty CRM — połączenie z Supabase (z config.js)
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// Pomocnicze
function qs(id){ return document.getElementById(id); }
function val(id){ return (qs(id).value||'').trim(); }
function enc(t){ return encodeURIComponent(t).replace(/%20/g,'+'); }
function normalizeE164(raw){
  if(!raw) return '';
  let s = raw.replace(/[^\d+]/g,'');
  if(s.startsWith('00')) s = '+' + s.slice(2);
  if(!s.startsWith('+')){
    const only = s.replace(/\D/g,'');
    s = (only.length===9 ? (window.BRAND_PL_PREFIX||'+48') + only : '+' + only.replace(/^0+/,''));
  }
  return s;
}
function buildWAMessage(l){
  const camps = [
    l.camp_jastrowie && 'Jastrowie',
    l.camp_lipka && 'Lipka',
    l.camp_dabki && 'Dąbki',
    l.camp_pobierowo && 'Pobierowo',
    l.camp_rewal && 'Rewal',
  ].filter(Boolean).join(', ') || '-';
  return [
    `🟢 Dzień dobry ${l.person||''}!`,
    `Tu SuperObozy 🌲 (opiekun: ${l.owner || window.BRAND_DEFAULT_OWNER || 'Piotr'}).`,
    `🏫 Klub/Szkoła: ${l.club||'-'}`,
    `🤸 Dyscyplina: ${l.sport||'-'}`,
    `👥 Uczestnicy: ${l.participants||'-'}`,
    `📅 Termin/okno: ${l.term_window||'-'}`,
    `📍 Lokalizacja: ${l.location_pref||'-'}`,
    `🏕️ Wybrane campy: ${camps}`,
    l.facilities ? `🧰 Zaplecze: ${l.facilities}` : '',
    '',
    'Przesyłam ofertę i chętnie dopasuję szczegóły. Czy możemy krótko porozmawiać dziś lub jutro? ☎️',
    '',
    'Zespół SuperObozy 🌲'
  ].filter(Boolean).join('\n');
}
function buildWALink(l){
  const e164 = normalizeE164(l.phone);
  const digits = (e164||'').replace(/\D/g,'');
  if(!digits) return '';
  return 'https://wa.me/' + digits + '?text=' + enc(buildWAMessage(l));
}

// Załaduj listę leadów
async function loadLeads(){
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending:false }).limit(200);
  const body = qs('leadBody'); body.innerHTML = '';
  if (error){ body.innerHTML = '<tr><td colspan=7> Błąd: '+error.message+'</td></tr>'; return; }
  (data||[]).forEach(l=>{
    const tr = document.createElement('tr');
    tr.className = 'row-click';
    tr.innerHTML = '<td>'+l.id+'</td><td>'+ (l.club||'') +'</td><td>'+ (l.person||'') +'</td><td>'+ (l.phone||'') +'</td><td>'+ (l.status||'') +'</td><td>'+ (l.next_contact||'—') +'</td><td class="right"><button class="ghost">Karta</button></td>';
    tr.onclick = () => openCard(l.id);
    body.appendChild(tr);
  });
}

// Dodaj lead
async function addLead(openWA){
  if (!val('club') || !val('person') || (!val('phone') && !val('email'))) {
    alert('Podaj: Klub, Osobę i telefon lub e-mail.'); return;
  }
  const insert = {
    source: val('source'),
    owner: val('owner') || (window.BRAND_DEFAULT_OWNER||'Piotr'),
    club: val('club'), person: val('person'),
    phone: val('phone'), email: val('email'),
    sport: val('sport'), participants: Number(val('participants')||0)||null,
    facilities: val('facilities'),
    term_window: val('term_window'), location_pref: val('location_pref'),
    camp_jastrowie: qs('camp_jastrowie').checked,
    camp_lipka: qs('camp_lipka').checked,
    camp_dabki: qs('camp_dabki').checked,
    camp_pobierowo: qs('camp_pobierowo').checked,
    camp_rewal: qs('camp_rewal').checked,
    follow_up_days: Number(val('followUpDays')||0) || null,
    next_contact: (Number(val('followUpDays')||0) ? new Date(Date.now()+86400000*Number(val('followUpDays'))).toISOString().slice(0,10) : null),
    notes: val('notes') || ''
  };
  insert.wa_link = buildWALink(insert);
  const { data, error } = await supabase.from('leads').insert(insert).select().single();
  if (error){ alert('Błąd: '+error.message); return; }

  // dziennik
  await supabase.from('journal').insert({
    lead_id: data.id, action:'Nowy lead', who:'www', note:`Źródło: ${insert.source}; Klub: ${insert.club}; Osoba: ${insert.person}`
  });

  if (openWA){
    const url = buildWALink(insert);
    if (url) window.open(url, '_blank');
  }
  // wyczyść pola i odśwież listę
  ['club','person','phone','email','sport','participants','facilities','term_window','location_pref','notes'].forEach(id=>qs(id).value='');
  ['camp_jastrowie','camp_lipka','camp_dabki','camp_pobierowo','camp_rewal'].forEach(id=>qs(id).checked=false);
  loadLeads();
}

// Karta klienta
async function openCard(id){
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error){ alert('Błąd: '+error.message); return; }
  window.CURRENT = lead;
  // Header
  qs('leadHeader').innerHTML = '<b>'+ (lead.club||'') +'</b> — '+ (lead.person||'') +' • '+ (lead.phone||'') +' • <a href="mailto:'+ (lead.email||'') +'">'+(lead.email||'')+'</a><div class="small">Dyscyplina: '+ (lead.sport||'-') +' • Uczestnicy: '+ (lead.participants||'-') +'</div>';
  // Status pills
  const ST = ['Nowy','Wysłano ofertę','W trakcie rozmów','Do decyzji','Wygrany','Przegrany','Nieaktualne'];
  const bar = qs('statusBar'); bar.innerHTML='';
  ST.forEach(s=>{
    const span = document.createElement('span');
    span.className = 'pill'+(s===lead.status?' active':'');
    span.textContent = s;
    span.onclick = async ()=>{
      const { error } = await supabase.from('leads').update({ status: s }).eq('id', id);
      if(error){ alert('Błąd: '+error.message); return; }
      await supabase.from('journal').insert({ lead_id:id, action:'Status', who:'www', note:'Ustawiono: '+s });
      openCard(id);
    };
    bar.appendChild(span);
  });

  // Historia
  const { data: hist } = await supabase.from('journal').select('*').eq('lead_id', id).order('created_at', { ascending:true });
  const wrap = qs('history'); wrap.innerHTML='';
  (hist||[]).forEach(h=>{
    const div = document.createElement('div');
    const dt = new Date(h.created_at).toLocaleString();
    div.innerHTML = '<div><b>'+h.action+'</b> <span class="small">('+dt+' · '+(h.who||'')+')</span></div><div>'+(h.note||'')+'</div><hr/>';
    wrap.appendChild(div);
  });
  qs('card').classList.remove('hidden');
}

// Zapis notatki + follow-up
async function saveNote(){
  const lead = window.CURRENT; if(!lead){ alert('Najpierw otwórz kartę klienta.'); return; }
  const note = val('note'); const days = Number(val('fuDays')||0);
  if (note){
    await supabase.from('journal').insert({ lead_id: lead.id, action:'Notatka', who:'www', note });
  }
  if (days>0){
    const when = new Date(Date.now()+86400000*days).toISOString().slice(0,10);
    await supabase.from('leads').update({ next_contact: when, follow_up_days: days }).eq('id', lead.id);
    await supabase.from('journal').insert({ lead_id: lead.id, action:'Follow-up', who:'www', note:`+${days} dni (${when})` });
  }
  qs('note').value=''; qs('fuDays').value='0';
  openCard(lead.id);
}

// WhatsApp
function openWA(){
  const lead = window.CURRENT;
  const url = buildWALink(lead);
  if(!url){ alert('Brak poprawnego numeru telefonu.'); return; }
  window.open(url,'_blank');
}

// Zdarzenia
qs('btnReload').onclick = loadLeads;
qs('btnAdd').onclick = ()=>addLead(false);
qs('btnAddAndWA').onclick = ()=>addLead(true);
qs('btnClose').onclick = ()=>qs('card').classList.add('hidden');
qs('btnSaveNote').onclick = saveNote;
qs('btnWA').onclick = openWA;

// Start
window.addEventListener('load', ()=>{
  // ustaw właściciela domyślnego
  qs('owner').value = window.BRAND_DEFAULT_OWNER || 'Piotr';
  loadLeads();
});
