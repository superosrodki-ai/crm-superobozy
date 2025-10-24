/* app.js – ONLINE (Supabase) + HARD-BIND */
(function () {
  const hasConfig = typeof SUPABASE_URL === "string" && SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && SUPABASE_ANON_KEY;
  const supabase = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const DEMO_LEADS = "superobozy_demo_leads";
  const DEMO_FUPS  = "superobozy_demo_followups";
  const DEMO_LOGS  = "superobozy_demo_logs";
  const demoLoad = (k) => JSON.parse(localStorage.getItem(k) || (k===DEMO_LOGS ? "{}":"[]"));
  const demoSave = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const el=(id)=>document.getElementById(id);
  function pickBtn({id,action,textIncludes}){
    let b=id && document.getElementById(id);
    if(!b && action) b=document.querySelector(`[data-action="${action}"]`);
    if(!b && textIncludes){
      const t=textIncludes.toLowerCase();
      b=Array.from(document.querySelectorAll("button,a.btn")).find(x=>(x.textContent||"").toLowerCase().includes(t));
    }
    return b||null;
  }

  const fields={source:el("source"),owner:el("owner"),club:el("club"),person:el("person"),phone:el("phone"),email:el("email"),discipline:el("discipline"),participants:el("participants"),facilities:el("facilities"),date_window:el("date_window"),pref_location:el("pref_location"),status:el("status"),priority:el("priority"),notes:el("notes"),follow_up:el("follow_up"),consent:el("consent")};
  const chipsEl=document.getElementById("camps");
  const ui={preview:document.getElementById("preview"),dup:el("dup-info"),fu:el("fu-info"),
    btnSave:pickBtn({id:"save-only",action:"save-only",textIncludes:"zapisz nowy"}),
    btnSaveWA:pickBtn({id:"save-and-wa",action:"save-and-wa",textIncludes:"whatsapp"}),
    btnSms:pickBtn({id:"btn-sms",action:"sms",textIncludes:"sms"}),
    btnEmail:pickBtn({id:"btn-email",action:"email",textIncludes:"e‑mail"}),
    btnWa:pickBtn({id:"btn-wa",action:"wa",textIncludes:"whatsapp"}),
    btnTemplates:pickBtn({id:"templates",action:"templates",textIncludes:"szablon"}),
    btnReset:pickBtn({id:"reset",action:"reset",textIncludes:"wyczyść"}),
    dlg:document.getElementById("dlg"),tplSms:document.getElementById("tpl-sms"),tplMailSubj:document.getElementById("tpl-mail-subj"),tplMailBody:document.getElementById("tpl-mail-body"),dlgCancel:document.getElementById("dlg-cancel"),dlgSave:document.getElementById("dlg-save")
  };
  const normPhone=(s)=>(s||"").replace(/\s|-/g,"");
  const phoneOk=(s)=>!s || /^\+?[0-9\s-]{7,}$/.test((s||"").trim());
  const emailOk=(s)=>!s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s||"").trim());

  const selectedCamps=new Set();
  if(chipsEl) chipsEl.addEventListener("click",(e)=>{ const t=e.target; if(!t.classList.contains("chip")) return; t.classList.toggle("active"); const v=t.dataset.v; if(t.classList.contains("active")) selectedCamps.add(v); else selectedCamps.delete(v); renderPreview(); });

  const TPL_KEY="superobozy_tpl_v1";
  (function loadTpl(){ try{ const j=JSON.parse(localStorage.getItem(TPL_KEY)||"{}"); if(j.sms) ui.tplSms.value=j.sms; if(j.mailSubj) ui.tplMailSubj.value=j.mailSubj; if(j.mailBody) ui.tplMailBody.value=j.mailBody; }catch{} })();
  function saveTpl(){ localStorage.setItem(TPL_KEY, JSON.stringify({ sms:ui.tplSms?.value||"", mailSubj:ui.tplMailSubj?.value||"", mailBody:ui.tplMailBody?.value||"" })); }

  function updateFollowupInfo(){ const box=document.getElementById("fu-info"); if(!box) return; const days=parseInt(fields.follow_up?.value||"3",10); const dt=new Date(); dt.setDate(dt.getDate()+days); box.textContent=`za ${days} dni → ${dt.toLocaleDateString("pl-PL",{year:"numeric",month:"2-digit",day:"2-digit"})}`; }
  Object.values(fields).forEach(f=>f && f.addEventListener("input",()=>{ updateFollowupInfo(); checkDuplicatesDebounced(); renderPreview(); }));
  updateFollowupInfo();

  let dupTimer=null; function debounce(fn,ms){ return function(){ clearTimeout(dupTimer); dupTimer=setTimeout(fn,ms); }; }
  const checkDuplicatesDebounced=debounce(checkDuplicates,350);
  async function checkDuplicates(){ const email=(fields.email?.value||"").trim().toLowerCase(); const phone=normPhone(fields.phone?.value||""); const club=(fields.club?.value||"").trim(); const box=ui.dup; if(!box) return; if(!email && !phone && !club){ box.textContent="—"; return; } if(hasConfig){ let q=supabase.from("leads").select("id,club,person,phone,email,status").limit(3); const or=[]; if(email) or.push(`email.eq.${email}`); if(phone) or.push(`phone.eq.${phone}`); if(club) or.push(`club.ilike.${encodeURIComponent(club)}`); if(or.length) q=q.or(or.join(",")); const {data,error}=await q; if(error){ box.textContent="błąd sprawdzania"; return; } if(data?.length){ box.innerHTML=data.map(d=>`#${d.id} ${d.club} • ${d.person||""} • ${d.email||d.phone||""} • ${d.status}`).join("\\n"); } else { box.textContent="brak"; } } else { const rows=demoLoad(DEMO_LEADS); const hits=rows.filter(r=> (email && r.email && r.email.toLowerCase()===email) || (phone && r.phone && normPhone(r.phone)===phone) || (club && r.club && r.club.toLowerCase()===club.toLowerCase())).slice(0,3); if(hits.length){ box.innerHTML=hits.map(d=>`DEMO ${d.club} • ${d.person||""} • ${d.email||d.phone||""}`).join("\\n"); } else { box.textContent="brak"; } } }

  function payload(){ return { source:fields.source?.value, owner:fields.owner?.value, club:(fields.club?.value||"").trim(), person:(fields.person?.value||"").trim(), phone:(fields.phone?.value||"").trim(), email:(fields.email?.value||"").trim(), discipline:fields.discipline?.value, participants:fields.participants?.value?parseInt(fields.participants.value,10):null, facilities:fields.facilities?.value, date_window:fields.date_window?.value, pref_location:fields.pref_location?.value, camps:Array.from(selectedCamps), status:fields.status?.value, priority:fields.priority?.value, notes:fields.notes?.value, consent:fields.consent?.value, lead_score:computeScore(), created_at:new Date().toISOString() }; }
  function computeScore(){ let sc=0; const n=parseInt(fields.participants?.value||"0",10); if(n>=80) sc+=40; else if(n>=50) sc+=30; else if(n>=30) sc+=20; if((fields.facilities?.value||"").toLowerCase().includes("hala")) sc+=10; if((fields.date_window?.value||"").match(/[0-9]{1,2}/)) sc+=10; if(selectedCamps.size) sc+=5; if(fields.priority?.value==="Wysoki") sc+=10; const src=fields.source?.value; if(src==="Telefon"||src==="Facebook"||src==="Instagram") sc+=5; return sc; }
  function validate(){ let ok=true; if(!fields.club?.value?.trim()) ok=false; if(fields.phone?.value && !phoneOk(fields.phone.value)) ok=false; if(fields.email?.value && !emailOk(fields.email.value)) ok=false; return ok; }
  function phoneOk(s){ return /^\+?[0-9\s-]{7,}$/.test((s||"").trim()); }
  function emailOk(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s||"").trim()); }

  async function saveLead(){ if(!validate()){ alert("Uzupełnij poprawnie: Klub/Szkoła oraz poprawny telefon/e‑mail."); return {ok:false}; } const body=payload(); const fuDays=parseInt(fields.follow_up?.value||"3",10); const fuAt=new Date(); fuAt.setDate(fuAt.getDate()+fuDays); if(hasConfig){ const {data,error}=await supabase.from("leads").insert(body).select("id").single(); if(error){ alert("Błąd zapisu do Supabase: "+error.message); return {ok:false}; } const leadId=data.id; await supabase.from("followups").insert({lead_id:leadId,due_at:fuAt.toISOString(),note:"Auto: follow‑up po "+fuDays+" dniach",status:"open"}).catch(()=>{}); try{ await supabase.from("activities").insert({lead_id:leadId,text:"Utworzono leada (status: "+body.status+")"});}catch{} currentLeadId=leadId; renderTimelineOnline(); return {ok:true,id:leadId}; } else { const rows=demoLoad(DEMO_LEADS); const id=rows.length?(Math.max(...rows.map(r=>Number(r.id)||0))+1):1; rows.push({id,...body}); demoSave(DEMO_LEADS,rows); const fups=demoLoad(DEMO_FUPS); fups.push({id:fups.length?(Math.max(...fups.map(x=>Number(x.id)||0))+1):1,lead_id:id,due_at:fuAt.toISOString(),note:"Auto: follow‑up po "+fuDays+" dniach",status:"open"}); demoSave(DEMO_FUPS,fups); logActivity(id,"Utworzono leada (status: "+body.status+")"); currentLeadId=id; renderTimelineLocal(); return {ok:true,id}; } }

  function fill(str){ const map={"{CLUB}":fields.club?.value||"klub/szkoła","{PERSON}":fields.person?.value||"Państwo","{PEOPLE}":fields.participants?.value||"uczestnicy","{DISCIPLINE}":fields.discipline?.value||"dyscyplina","{DATE}":fields.date_window?.value||"termin"}; return Object.keys(map).reduce((s,k)=>s.split(k).join(map[k]),str||""); }
  function buildSMS(){ return fill(document.getElementById("tpl-sms")?.value||""); }
  function buildMail(){ const subj=fill(document.getElementById("tpl-mail-subj")?.value||""), body=fill(document.getElementById("tpl-mail-body")?.value||""), to=(fields.email?.value||"").trim(); const mailto=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`; return {subj,body,to,mailto}; }
  function buildWA(){ const text=buildSMS(); const phone=normPhone(fields.phone?.value||""); return phone?`https://wa.me/${phone}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`; }
  function renderPreview(){ const sms=buildSMS(); const mail=buildMail(); if(ui.preview) ui.preview.textContent=`SMS/WA:\n${sms}\n\nE‑mail – TEMAT:\n${mail.subj}\n\nE‑mail – TREŚĆ:\n${mail.body}`; }

  let currentLeadId=null;
  async function renderTimelineOnline(){ const box=document.getElementById("timeline"); if(!box||!currentLeadId) return; try{ const {data}=await supabase.from("activities").select("*").eq("lead_id",currentLeadId).order("ts",{ascending:false}).limit(50); if(!data?.length){ box.innerHTML='<div class="subtle">Brak aktywności.</div>'; return; } box.innerHTML=data.map(l=>`<div class="tl-item" style="display:flex;gap:10px;margin-bottom:8px"><div style="width:10px;height:10px;border-radius:999px;background:#6b7280;margin-top:6px"></div><div><div>${l.text}</div><div class="subtle mono">${new Date(l.ts).toLocaleString('pl-PL')}</div></div></div>`).join(""); }catch{ box.innerHTML='<div class="subtle">Timeline online pojawi się po utworzeniu tabeli activities.</div>'; } }
  function logActivity(leadId,text){ if(hasConfig){ supabase.from("activities").insert({lead_id:leadId,text}).catch(()=>{}); } else { const logs=demoLoad(DEMO_LOGS); logs[leadId]=logs[leadId]||[]; logs[leadId].unshift({ts:new Date().toISOString(),text}); demoSave(DEMO_LOGS,logs); } }

  function bind(){ if(ui.btnTemplates && ui.dlg) ui.btnTemplates.addEventListener("click",()=>ui.dlg.showModal()); if(ui.dlgCancel && ui.dlg) ui.dlgCancel.addEventListener("click",()=>ui.dlg.close()); if(ui.dlgSave && ui.dlg) ui.dlgSave.addEventListener("click",()=>{ saveTpl(); ui.dlg.close(); renderPreview(); }); if(ui.btnSave) ui.btnSave.addEventListener("click",async()=>{ const r=await saveLead(); if(r.ok) alert("Zapisano kontakt #"+r.id); }); if(ui.btnSaveWA) ui.btnSaveWA.addEventListener("click",async()=>{ const r=await saveLead(); if(r.ok){ window.open(buildWA(),"_blank"); logActivity(currentLeadId,"Zapis + WhatsApp"); } }); if(ui.btnSms) ui.btnSms.addEventListener("click",async()=>{ const sms=buildSMS(); try{ await navigator.clipboard.writeText(sms);}catch{} alert("Tekst SMS skopiowany."); logActivity(currentLeadId,"Skopiowano SMS"); }); if(ui.btnEmail) ui.btnEmail.addEventListener("click",()=>{ window.location.href=buildMail().mailto; logActivity(currentLeadId,"Otworzono klienta e‑mail"); }); if(ui.btnWa) ui.btnWa.addEventListener("click",()=>{ window.open(buildWA(),"_blank"); logActivity(currentLeadId,"Otworzono WhatsApp"); }); if(ui.btnReset) ui.btnReset.addEventListener("click",()=>{ if(!confirm("Wyczyścić formularz?")) return; document.getElementById("contact-form")?.reset(); document.getElementById("contact-meta")?.reset(); selectedCamps.clear(); Array.from((chipsEl||document).querySelectorAll(".chip")).forEach(c=>c.classList.remove("active")); renderPreview(); }); }
  renderPreview(); updateFollowupInfo(); bind();
})();