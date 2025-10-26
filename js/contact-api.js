// js/contact-api.js
(function(){
  function formToPayload(form){
    const fd = new FormData(form);
    const obj = {};
    for (const [k,v] of fd.entries()){
      if (k === 'participants') { obj[k] = v ? parseInt(v, 10) : null; }
      else if (k === 'camps') { (obj[k]||(obj[k]=[])).push(v); }
      else { obj[k] = v || null; }
    }
    return obj;
  }
  async function saveContact(payload){
    const res = await fetch('/api/contacts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const text = await res.text(); let json;
    try{ json = JSON.parse(text); }catch(_){ json = { error: text }; }
    if (!res.ok) throw new Error(json.error || 'Błąd zapisu');
    return json.data;
  }
  function init(){
    const form = document.getElementById('contactForm');
    const btn  = document.getElementById('saveContactBtn');
    if (!form || !btn) return;
    btn.addEventListener('click', async (e)=>{
      e.preventDefault(); btn.disabled=true; btn.textContent='Zapisywanie...';
      try{ const payload=formToPayload(form); await saveContact(payload); alert('Zapisano kontakt ✅'); form.reset(); }
      catch(err){ alert('Błąd: '+(err.message||err)); }
      finally{ btn.disabled=false; btn.textContent='💾 Zapisz kontakt'; }
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
