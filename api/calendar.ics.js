import { allowCors, supabaseSelect } from './_common.js';

export default allowCors(async function handler(req, res){
  // Public ICS feed of upcoming reservations for Mac Calendar subscription
  // GET /calendar.ics -> text/calendar
  const rows = await supabaseSelect(process.env.SUPABASE_TABLE_RESERVATIONS || 'reservations', { select: '*', order: 'date_from.desc' });
  const now = new Date();
  const upcoming = rows.filter(r => new Date(r.date_to || r.date_from) >= now);
  const ics = buildCalendar(upcoming);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.end(ics);
});

function buildCalendar(rows){
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRM SuperObozy//Calendar Feed//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  const pad = n => String(n).padStart(2,'0');
  const fmt = (d) => {
    const dt = new Date(d);
    return dt.getUTCFullYear()+pad(dt.getUTCMonth()+1)+pad(dt.getUTCDate())+
           'T'+pad(dt.getUTCHours())+pad(dt.getUTCMinutes())+pad(dt.getUTCSeconds())+'Z';
  };
  const esc = (s) => String(s||'').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

  for (const r of rows){
    const uid = r.id || `${r.group_name}-${r.date_from}`;
    const start = r.date_from ? fmt(r.date_from) : fmt(new Date());
    const end = r.date_to ? fmt(r.date_to) : fmt(new Date(new Date(r.date_from).getTime()+24*3600*1000));
    const summary = `Rezerwacja: ${r.group_name || 'Grupa'}`;
    const description = `Osoba: ${r.contact_person || ''}\\nEmail: ${r.email || ''}\\nTelefon: ${r.phone || ''}\\nMiejsca: ${r.capacity || ''}\\nUwagi: ${r.notes || ''}`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${esc(uid)}@superobozy.pl`);
    lines.push(`DTSTAMP:${fmt(new Date())}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${esc(summary)}`);
    lines.push(`DESCRIPTION:${esc(description)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
