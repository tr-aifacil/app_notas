alter table patient
add column if not exists name text not null default '';
