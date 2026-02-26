create extension if not exists "pgcrypto";

create type episode_status as enum ('ativo', 'alta', 'administrativo');
create type session_type as enum ('avaliacao', 'tratamento', 'reavaliacao', 'alta');
create type scale_type as enum ('END', 'DASH', 'KOOS', 'RolandMorris', 'NDI');
create type profile_role as enum ('admin', 'clinician');

create table if not exists patient (
  id uuid primary key default gen_random_uuid(),
  internal_code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists episode_of_care (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient(id) on delete cascade,
  profession text not null,
  area text not null,
  start_date date not null,
  end_date date null,
  status episode_status not null default 'ativo',
  created_at timestamptz not null default now()
);

create table if not exists session (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode_of_care(id) on delete cascade,
  date timestamptz not null,
  clinician text not null,
  type session_type not null,
  subjective text not null default '',
  objective text not null default '',
  clinical_analysis text not null default '',
  intervention text not null default '',
  response text not null default '',
  plan text not null default '',
  subjective_transcript text not null default '',
  objective_transcript text not null default '',
  clinical_analysis_transcript text not null default '',
  intervention_transcript text not null default '',
  response_transcript text not null default '',
  plan_transcript text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists scale_result (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode_of_care(id) on delete cascade,
  session_id uuid null references session(id) on delete set null,
  type scale_type not null,
  value numeric not null,
  applied_at date not null,
  created_at timestamptz not null default now()
);

create table if not exists alert_log (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode_of_care(id) on delete cascade,
  session_id uuid null references session(id) on delete set null,
  rule_code text not null,
  message text not null,
  created_at timestamptz not null default now(),
  dismissed boolean not null default false,
  dismissed_by text null,
  dismissed_at timestamptz null
);

create table if not exists discharge_report_version (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode_of_care(id) on delete cascade,
  generated_at timestamptz not null default now(),
  generated_by text not null,
  content text not null default '',
  source_snapshot jsonb not null default '{}'::jsonb,
  is_final boolean not null default false
);

create table if not exists profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role profile_role not null default 'clinician',
  created_at timestamptz not null default now()
);

create index if not exists idx_episode_patient on episode_of_care(patient_id);
create index if not exists idx_session_episode_date on session(episode_id, date);
create index if not exists idx_scale_episode_type_date on scale_result(episode_id, type, applied_at);
create index if not exists idx_alert_episode_created on alert_log(episode_id, created_at);
create index if not exists idx_report_episode_generated on discharge_report_version(episode_id, generated_at);
