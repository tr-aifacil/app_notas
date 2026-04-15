alter table alert_log
alter column rule_code drop not null,
alter column rule_code set default 'MANUAL';

alter table alert_log
add column if not exists title text not null default '',
add column if not exists due_date date null,
add column if not exists created_by uuid null references auth.users(id) on delete set null;
