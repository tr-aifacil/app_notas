alter table patient enable row level security;
alter table episode_of_care enable row level security;
alter table session enable row level security;
alter table scale_result enable row level security;
alter table alert_log enable row level security;
alter table discharge_report_version enable row level security;
alter table profile enable row level security;

create policy "authenticated_all_patient" on patient for all to authenticated using (true) with check (true);
create policy "authenticated_all_episode" on episode_of_care for all to authenticated using (true) with check (true);
create policy "authenticated_all_session" on session for all to authenticated using (true) with check (true);
create policy "authenticated_all_scale" on scale_result for all to authenticated using (true) with check (true);
create policy "authenticated_all_alert" on alert_log for all to authenticated using (true) with check (true);
create policy "authenticated_all_report" on discharge_report_version for all to authenticated using (true) with check (true);
create policy "authenticated_all_profile" on profile for all to authenticated using (true) with check (true);
