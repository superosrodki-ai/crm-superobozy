create extension if not exists pgcrypto;
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  source text, owner text, club text, person text, phone text, email text,
  discipline text, participants int, facilities text, term text, location text,
  camps text[], status text, priority text, notes text, created_at timestamptz default now()
);
alter table public.contacts enable row level security;
