alter table public.appointments
  add column if not exists google_event_id text,
  add column if not exists google_calendar_id text;

create unique index if not exists appointments_google_event_id_key
  on public.appointments (google_event_id)
  where google_event_id is not null;

create index if not exists appointments_member_start_idx
  on public.appointments (member_id, start_at);
