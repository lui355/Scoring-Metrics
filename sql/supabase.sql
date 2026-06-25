-- Fishbowl Topics Supabase schema and RLS policies
create extension if not exists pgcrypto;

create table public.fishbowls (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled Fishbowl',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  fishbowl_id uuid not null references public.fishbowls(id) on delete cascade,
  topic text not null check (char_length(trim(topic)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.fishbowls enable row level security;
alter table public.submissions enable row level security;

grant usage on schema public to anon;
grant select, insert, update on public.fishbowls to anon;
grant select, insert on public.submissions to anon;


create policy "Anyone can create fishbowls"
  on public.fishbowls for insert
  to anon
  with check (true);

create policy "Anyone can read fishbowls"
  on public.fishbowls for select
  to anon
  using (true);

create policy "Anyone can update fishbowl open status"
  on public.fishbowls for update
  to anon
  using (true)
  with check (true);

create policy "Anyone can read submissions"
  on public.submissions for select
  to anon
  using (true);

create policy "Anonymous users can submit to open fishbowls"
  on public.submissions for insert
  to anon
  with check (
    exists (
      select 1
      from public.fishbowls
      where fishbowls.id = submissions.fishbowl_id
        and fishbowls.is_open = true
    )
  );

alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.fishbowls;
