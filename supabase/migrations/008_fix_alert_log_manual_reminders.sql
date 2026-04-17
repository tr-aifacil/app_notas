-- Ensures alert_log supports manual reminders payload used by the app.
alter table if exists alert_log
  alter column rule_code drop not null,
  alter column rule_code set default 'MANUAL';

alter table if exists alert_log
  add column if not exists title text,
  add column if not exists due_date date null,
  add column if not exists created_by uuid null references auth.users(id) on delete set null;

update alert_log
set title = coalesce(nullif(btrim(title), ''), 'Lembrete manual')
where title is null or btrim(title) = '';

alter table if exists alert_log
  alter column title set default '',
  alter column title set not null;
