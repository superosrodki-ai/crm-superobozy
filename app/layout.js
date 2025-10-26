export const metadata = { title: 'CRM SuperObozy — PRO' };
export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body style={{background:'#0b0e14', color:'#e6e9ef', margin:0}}>
        <header style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderBottom:'1px solid #1b1f2a',position:'sticky',top:0,backdropFilter:'blur(6px)',background:'rgba(11,14,20,0.75)'}}>
          <img src="/logo.svg" alt="CRM SuperObozy" height="28" />
          <strong>CRM SuperObozy — PRO</strong>
          <nav style={{marginLeft:'auto',display:'flex',gap:16}}>
            <a href="/contact.html" style={{color:'#9ecbff',textDecoration:'none'}}>Dodaj kontakt</a>
            <a href="/admin" style={{color:'#9ecbff',textDecoration:'none'}}>Dashboard</a>
          </nav>
        </header>
        <main style={{maxWidth:1100, margin:'24px auto', padding:'0 16px'}}>{children}</main>
      </body>
    </html>
  );
}
