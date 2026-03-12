alter table session
  add column if not exists clinician_id uuid null references profile(id) on delete set null;

alter table session
  alter column clinician drop not null;

create index if not exists idx_session_clinician_id on session(clinician_id);
