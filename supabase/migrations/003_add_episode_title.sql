alter table public.episode_of_care
  add column title text not null default '';

update public.episode_of_care
set title = concat_ws(' / ', profession, area)
where title = '';
