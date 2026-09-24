-- Apply only after creating at least one admin profile. Existing patients with no
-- sessions need an admin to grant their clinicians access after this migration.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.patient_access (
  patient_id uuid not null references public.patient(id) on delete cascade,
  clinician_id uuid not null references public.profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, clinician_id)
);
create index if not exists idx_patient_access_clinician on public.patient_access(clinician_id);

insert into public.patient_access (patient_id, clinician_id)
select distinct e.patient_id, s.clinician_id
from public.session s
join public.episode_of_care e on e.id = s.episode_id
join public.profile p on p.id = s.clinician_id
where s.clinician_id is not null
on conflict do nothing;

alter table public.episode_of_care add column if not exists archived_at timestamptz;
alter table public.episode_of_care add column if not exists archived_by uuid references public.profile(id);
alter table public.session add column if not exists archived_at timestamptz;
alter table public.session add column if not exists archived_by uuid references public.profile(id);
alter table public.scale_result add column if not exists archived_at timestamptz;
alter table public.scale_result add column if not exists archived_by uuid references public.profile(id);

create or replace function private.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profile p where p.id = (select auth.uid()));
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profile p
                 where p.id = (select auth.uid()) and p.role = 'admin');
$$;

create or replace function private.can_access_patient(target_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists (
    select 1 from public.patient_access a
    where a.patient_id = target_id and a.clinician_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_episode(target_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.episode_of_care e
                 where e.id = target_id and e.archived_at is null
                   and private.can_access_patient(e.patient_id));
$$;

revoke all on function private.is_member(), private.is_admin(),
  private.can_access_patient(uuid), private.can_access_episode(uuid) from public, anon;
grant execute on function private.is_member(), private.is_admin(),
  private.can_access_patient(uuid), private.can_access_episode(uuid) to authenticated;

create or replace function private.grant_creator_patient_access() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null then
    insert into public.patient_access(patient_id, clinician_id)
    values (new.id, (select auth.uid())) on conflict do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists grant_creator_patient_access on public.patient;
create trigger grant_creator_patient_access after insert on public.patient
for each row execute function private.grant_creator_patient_access();
revoke all on function private.grant_creator_patient_access() from public, anon, authenticated;

alter table public.patient_access enable row level security;

-- Keep archival metadata trustworthy even when updates come directly from the Data API.
create or replace function private.stamp_archive() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.archived_at is distinct from old.archived_at then
    if new.archived_at is not null then
      new.archived_at := now();
      new.archived_by := (select auth.uid());
    elsif not private.is_admin() then
      raise exception 'Only an admin may restore archived records';
    else
      new.archived_by := null;
    end if;
  elsif new.archived_by is distinct from old.archived_by then
    new.archived_by := old.archived_by;
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_archive() from public, anon, authenticated;
drop trigger if exists stamp_episode_archive on public.episode_of_care;
create trigger stamp_episode_archive before update on public.episode_of_care
for each row execute function private.stamp_archive();
drop trigger if exists stamp_session_archive on public.session;
create trigger stamp_session_archive before update on public.session
for each row execute function private.stamp_archive();
drop trigger if exists stamp_scale_archive on public.scale_result;
create trigger stamp_scale_archive before update on public.scale_result
for each row execute function private.stamp_archive();

drop policy if exists authenticated_all_patient on public.patient;
drop policy if exists authenticated_all_episode on public.episode_of_care;
drop policy if exists authenticated_all_session on public.session;
drop policy if exists authenticated_all_scale on public.scale_result;
drop policy if exists authenticated_all_alert on public.alert_log;
drop policy if exists authenticated_all_report on public.discharge_report_version;
drop policy if exists authenticated_all_profile on public.profile;

create policy patient_read on public.patient for select to authenticated
  using (private.can_access_patient(id));
create policy patient_create on public.patient for insert to authenticated
  with check (private.is_member());
create policy patient_edit on public.patient for update to authenticated
  using (private.can_access_patient(id)) with check (private.can_access_patient(id));

create policy episode_access on public.episode_of_care for all to authenticated
  using (private.can_access_patient(patient_id))
  with check (private.can_access_patient(patient_id));
create policy session_access on public.session for all to authenticated
  using (private.can_access_episode(episode_id))
  with check (private.can_access_episode(episode_id));
create policy scale_access on public.scale_result for all to authenticated
  using (private.can_access_episode(episode_id))
  with check (private.can_access_episode(episode_id));
create policy alert_access on public.alert_log for all to authenticated
  using (private.can_access_episode(episode_id))
  with check (private.can_access_episode(episode_id));
create policy report_access on public.discharge_report_version for all to authenticated
  using (private.can_access_episode(episode_id))
  with check (private.can_access_episode(episode_id));

create policy profile_read on public.profile for select to authenticated
  using (private.is_member());
create policy profile_admin_write on public.profile for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy access_read on public.patient_access for select to authenticated
  using (clinician_id = (select auth.uid()) or private.is_admin());
create policy access_admin_write on public.patient_access for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

revoke all on public.patient, public.episode_of_care, public.session,
  public.scale_result, public.alert_log, public.discharge_report_version,
  public.profile, public.patient_access from anon, authenticated;
grant select, insert, update on public.patient, public.episode_of_care,
  public.session, public.scale_result, public.alert_log,
  public.discharge_report_version to authenticated;
grant select, insert, update, delete on public.patient_access to authenticated;
grant select, insert, update on public.profile to authenticated;

-- Metrics are fetched only by the server endpoint after an admin check.
alter view public.admin_episode_metrics_v1 set (security_invoker = true);
alter view public.admin_data_quality_v1 set (security_invoker = true);
revoke all on public.admin_episode_metrics_v1, public.admin_data_quality_v1
  from public, anon, authenticated;
grant select on public.admin_episode_metrics_v1, public.admin_data_quality_v1 to service_role;
