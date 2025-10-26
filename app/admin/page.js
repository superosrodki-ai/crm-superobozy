// app/admin/page.js
async function getContacts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/contacts`, { cache: 'no-store' });
  if (!res.ok) return { error: await res.text() };
  return res.json();
}

export const dynamic = 'force-dynamic';

export default async function AdminPage(){
  const data = await getContacts();
  const items = data?.data || [];
  return (
    <section>
      <h1 style={{margin:'12px 0 18px'}}>📊 Kontakty</h1>
      {data?.error && <p style={{color:'#ff9b9b'}}>Błąd: {data.error}</p>}
      <div style={{display:'grid',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 80px',gap:8,opacity:0.8}}>
          <strong>Klub</strong><strong>Osoba</strong><strong>Telefon</strong><strong>E-mail</strong><strong>Osób</strong>
        </div>
        {items.map((r)=>(
          <div key={r.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 80px',gap:8,padding:'10px',border:'1px solid #1b1f2a',borderRadius:10,background:'#111522'}}>
            <div>{r.club || '—'}</div>
            <div>{r.person || '—'}</div>
            <div>{r.phone || '—'}</div>
            <div>{r.email || '—'}</div>
            <div>{r.participants ?? '—'}</div>
          </div>
        ))}
        {items.length === 0 && <p style={{opacity:0.7}}>Brak kontaktów.</p>}
      </div>
    </section>
  );
}
