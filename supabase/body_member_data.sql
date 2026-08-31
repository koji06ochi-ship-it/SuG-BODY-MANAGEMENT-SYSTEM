-- S.u.G BODY member data store / V27.52
-- Apply in Supabase SQL editor.

create table if not exists public.body_member_data (
  member_id uuid primary key references public.profiles(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists body_member_data_updated_at_idx
  on public.body_member_data (updated_at desc);

alter table public.body_member_data enable row level security;

drop policy if exists "body member reads own" on public.body_member_data;
create policy "body member reads own"
  on public.body_member_data for select
  to authenticated
  using (member_id = auth.uid());

drop policy if exists "body member inserts own" on public.body_member_data;
create policy "body member inserts own"
  on public.body_member_data for insert
  to authenticated
  with check (member_id = auth.uid());

drop policy if exists "body member updates own" on public.body_member_data;
create policy "body member updates own"
  on public.body_member_data for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists "trainer reads all body data" on public.body_member_data;
create policy "trainer reads all body data"
  on public.body_member_data for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'trainer'
    )
  );

drop policy if exists "trainer updates all body data" on public.body_member_data;
create policy "trainer updates all body data"
  on public.body_member_data for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'trainer'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'trainer'
    )
  );

create or replace function public.touch_body_member_data_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists body_member_data_touch_updated_at on public.body_member_data;
create trigger body_member_data_touch_updated_at
before update on public.body_member_data
for each row execute function public.touch_body_member_data_updated_at();
