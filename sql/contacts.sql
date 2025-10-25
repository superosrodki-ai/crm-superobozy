create extension if not exists pgcrypto;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  source text,
  owner text,
  club text,
  person text,
  phone text,
  email text,
  discipline text,
  participants int,
  facilities text,
  term text,
  location text,
  camps text[],
  status text,
  priority text,
  notes text,
  created_at timestamptz default now()
);

alter table public.contacts enable row level security;

-- Minimalna polityka (jeśli będziesz kiedyś korzystać z anon na froncie)
do $$
begin
  if not exists (
    select 1 from pg_policies where polname = 'allow insert from anon on contacts'
  ) then
    create policy "allow insert from anon on contacts"
    on public.contacts for insert
    to anon
    with check (true);
  end if;
end $$;
