import { json, allowCors, buildICS } from './_common.js';
import { Resend } from 'resend';

function b64(content, filename, type='text/plain'){
  return {
    content: Buffer.from(content).toString('base64'),
    filename,
    type
  };
}

async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok:false, message:'Use POST' });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.OFFER_FROM_EMAIL || 'oferty@superobozy.pl';
  if (!apiKey) return json(res, 400, { ok:false, message:'Brak RESEND_API_KEY (Vercel → Env Vars)' });
  try {
    const bodyRaw = await readBody(req);
    const body = JSON.parse(bodyRaw || '{}');
    const {
      to, subject, html, // wymagane
      attach_ics, // bool
      ics_title, ics_description, ics_location, ics_start, ics_end // opcjonalnie
    } = body;

    if (!to || !subject || !html) return json(res, 400, { ok:false, message:'Wymagane: to, subject, html' });

    const resend = new Resend(apiKey);
    const attachments = [];

    if (attach_ics && ics_start && ics_end) {
      const ics = buildICS({
        uid: `offer-${Date.now()}@superobozy.pl`,
        title: ics_title || subject,
        description: ics_description || 'Oferta / Termin rezerwacji',
        start: ics_start,
        end: ics_end,
        location: ics_location || ''
      });
      attachments.push(b64(ics, 'termin.ics', 'text/calendar'));
    }

    const r = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments
    });

    return json(res, 200, { ok:true, id: r.id || null });
  } catch (e) {
    return json(res, 500, { ok:false, message: e.message || String(e) });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default allowCors(handler);
