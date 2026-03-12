alter table public.episode_of_care
  add column if not exists body_region text null,
  add column if not exists condition_type text null,
  add column if not exists condition_chronicity text null,
  add column if not exists case_type text null,
  add column if not exists laterality text null,
  add column if not exists analytics_included boolean not null default false,
  add column if not exists analytics_label text null;

alter table public.episode_of_care
  drop constraint if exists episode_of_care_analytics_included_by_case_type_chk;

alter table public.episode_of_care
  add constraint episode_of_care_analytics_included_by_case_type_chk
  check (
    analytics_included = (
      case
        when case_type = 'novo_caso' then true
        else false
      end
    )
  );

drop index if exists public.idx_episode_label;

drop view if exists public.admin_data_quality_v1;
drop view if exists public.admin_episode_metrics_v1;

alter table public.episode_of_care
drop column if exists episode_label;

create index if not exists idx_episode_structured_classification
  on public.episode_of_care(case_type, body_region, condition_type, condition_chronicity, analytics_included);

create or replace view public.admin_episode_metrics_v1 as
with session_agg as (
  select
    s.episode_id,
    count(*)::int as session_count,
    min(s.date)::date as first_session_date,
    max(s.date)::date as last_session_date,
    count(distinct s.clinician_id)::int as clinician_count
  from public.session s
  group by s.episode_id
),
alert_agg as (
  select
    a.episode_id,
    count(*)::int as alerts_count,
    count(*) filter (where a.dismissed)::int as dismissed_alerts_count
  from public.alert_log a
  group by a.episode_id
),
report_agg as (
  select
    r.episode_id,
    count(*)::int as report_versions_count,
    bool_or(r.is_final) as has_final_report
  from public.discharge_report_version r
  group by r.episode_id
),
scale_agg as (
  select
    sc.episode_id,
    count(*)::int as scale_count_total,
    bool_or(sc.type = 'END') as has_end,
    bool_or(sc.type = 'DASH') as has_dash,
    bool_or(sc.type = 'KOOS') as has_koos,
    bool_or(sc.type = 'NDI') as has_ndi,
    bool_or(sc.type = 'RolandMorris') as has_rolandmorris
  from public.scale_result sc
  group by sc.episode_id
),
scale_first_last as (
  select
    e.id as episode_id,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'END'
      order by sc.applied_at asc, sc.created_at asc
      limit 1
    ) as first_end,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'END'
      order by sc.applied_at desc, sc.created_at desc
      limit 1
    ) as last_end,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'DASH'
      order by sc.applied_at asc, sc.created_at asc
      limit 1
    ) as first_dash,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'DASH'
      order by sc.applied_at desc, sc.created_at desc
      limit 1
    ) as last_dash,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'KOOS'
      order by sc.applied_at asc, sc.created_at asc
      limit 1
    ) as first_koos,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'KOOS'
      order by sc.applied_at desc, sc.created_at desc
      limit 1
    ) as last_koos,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'NDI'
      order by sc.applied_at asc, sc.created_at asc
      limit 1
    ) as first_ndi,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'NDI'
      order by sc.applied_at desc, sc.created_at desc
      limit 1
    ) as last_ndi,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'RolandMorris'
      order by sc.applied_at asc, sc.created_at asc
      limit 1
    ) as first_rolandmorris,
    (
      select sc.value from public.scale_result sc
      where sc.episode_id = e.id and sc.type = 'RolandMorris'
      order by sc.applied_at desc, sc.created_at desc
      limit 1
    ) as last_rolandmorris
  from public.episode_of_care e
)
select
  e.id as episode_id,
  e.patient_id,
  e.title,
  e.analytics_label,
  e.analytics_included,
  e.case_type,
  e.body_region,
  e.condition_type,
  e.condition_chronicity,
  e.profession,
  e.area,
  e.status,
  e.outcome_status,
  e.start_date,
  e.end_date,
  e.outcome_date,
  (coalesce(e.outcome_date, e.end_date, current_date) - e.start_date)::int as episode_duration_days,
  case
    when e.outcome_status = 'recovered' and e.outcome_date is not null
      then (e.outcome_date - e.start_date)::int
    else null
  end as recovery_days,
  coalesce(sa.session_count, 0) as session_count,
  sa.first_session_date,
  sa.last_session_date,
  coalesce(sa.clinician_count, 0) as clinician_count,
  coalesce(aa.alerts_count, 0) as alerts_count,
  coalesce(aa.dismissed_alerts_count, 0) as dismissed_alerts_count,
  coalesce(ra.report_versions_count, 0) as report_versions_count,
  coalesce(ra.has_final_report, false) as has_final_report,
  coalesce(sca.scale_count_total, 0) as scale_count_total,
  coalesce(sca.has_end, false) as has_end,
  coalesce(sca.has_dash, false) as has_dash,
  coalesce(sca.has_koos, false) as has_koos,
  coalesce(sca.has_ndi, false) as has_ndi,
  coalesce(sca.has_rolandmorris, false) as has_rolandmorris,
  sfl.first_end,
  sfl.last_end,
  case when sfl.first_end is not null and sfl.last_end is not null then sfl.last_end - sfl.first_end else null end as delta_end,
  sfl.first_dash,
  sfl.last_dash,
  case when sfl.first_dash is not null and sfl.last_dash is not null then sfl.last_dash - sfl.first_dash else null end as delta_dash,
  sfl.first_koos,
  sfl.last_koos,
  case when sfl.first_koos is not null and sfl.last_koos is not null then sfl.last_koos - sfl.first_koos else null end as delta_koos,
  sfl.first_ndi,
  sfl.last_ndi,
  case when sfl.first_ndi is not null and sfl.last_ndi is not null then sfl.last_ndi - sfl.first_ndi else null end as delta_ndi,
  sfl.first_rolandmorris,
  sfl.last_rolandmorris,
  case when sfl.first_rolandmorris is not null and sfl.last_rolandmorris is not null then sfl.last_rolandmorris - sfl.first_rolandmorris else null end as delta_rolandmorris
from public.episode_of_care e
left join session_agg sa on sa.episode_id = e.id
left join alert_agg aa on aa.episode_id = e.id
left join report_agg ra on ra.episode_id = e.id
left join scale_agg sca on sca.episode_id = e.id
left join scale_first_last sfl on sfl.episode_id = e.id;

create or replace view public.admin_data_quality_v1 as
with metrics as (
  select * from public.admin_episode_metrics_v1
)
select
  m.episode_id,
  m.patient_id,
  m.title,
  m.analytics_label,
  (coalesce(trim(m.title), '') = '') as missing_title,
  (
    coalesce(trim(m.body_region), '') = ''
    or coalesce(trim(m.condition_type), '') = ''
    or coalesce(trim(m.case_type), '') = ''
  ) as missing_structured_classification,
  (m.session_count = 0) as no_sessions,
  (m.scale_count_total = 0) as no_scales,
  (m.status <> 'ativo' and m.outcome_status = 'ongoing') as closed_without_outcome,
  (m.outcome_status <> 'ongoing' and m.outcome_date is null) as outcome_without_outcome_date,
  (m.outcome_status = 'recovered' and m.outcome_date is null) as recovered_without_outcome_date,
  (m.end_date is not null and m.end_date < m.start_date) as end_date_before_start_date,
  (m.session_count > 0 and m.scale_count_total <= 1) as sparse_scale_data,
  case
    when (m.end_date is not null and m.end_date < m.start_date)
      or (m.outcome_status = 'recovered' and m.outcome_date is null)
      or (m.status <> 'ativo' and m.outcome_status = 'ongoing')
      then 'critical'
    when (coalesce(trim(m.title), '') = '')
      or (
        coalesce(trim(m.body_region), '') = ''
        or coalesce(trim(m.condition_type), '') = ''
        or coalesce(trim(m.case_type), '') = ''
      )
      or (m.session_count = 0)
      or (m.scale_count_total = 0)
      or (m.outcome_status <> 'ongoing' and m.outcome_date is null)
      or (m.session_count > 0 and m.scale_count_total <= 1)
      then 'warning'
    else 'ok'
  end as severity
from metrics m;
