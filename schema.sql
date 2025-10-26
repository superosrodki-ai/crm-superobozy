-- SUPABASE SQL — skopiuj do Supabase → SQL Editor → RUN

create table if not exists leads (
  id bigserial primary key,
  created_at timestamptz default now(),
  source text, club text, person text,
  phone text, email text,
  sport text, participants int,
  facilities text,
  term_window text, location_pref text,
  camp_jastrowie bool default false,
  camp_lipka bool default false,
  camp_dabki bool default false,
  camp_pobierowo bool default false,
  camp_rewal bool default false,
  status text default 'Nowy',
  owner text default 'Piotr',
  next_contact date,
  follow_up_days int,
  notes text,
  wa_link text
);

create table if not exists journal (
  id bigserial primary key,
  created_at timestamptz default now(),
  lead_id bigint references leads(id) on delete cascade,
  action text,
  who text,
  note text
);

create index if not exists journal_lead_id_idx on journal(lead_id);
create index if not exists leads_next_contact_idx on leads(next_contact);
