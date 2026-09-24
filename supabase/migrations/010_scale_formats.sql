-- Preserve old scores without assuming whether they were points or percentages.
alter type public.scale_type add value if not exists 'QuickDASH';

alter table public.scale_result
  add column if not exists score_format text null,
  add column if not exists koos_subscale text null;

create or replace function private.validate_scale_result() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.score_format is null then
    raise exception 'Escolhe o formato da pontuação para a escala';
  end if;

  if new.type = 'END' then
    if new.score_format <> 'points_10' or new.value < 0 or new.value > 10 then
      raise exception 'END: valor entre 0 e 10';
    end if;
  elsif new.type in ('DASH', 'QuickDASH') then
    if new.score_format <> 'points_100' or new.value < 0 or new.value > 100 then
      raise exception 'DASH/QuickDASH: pontuação entre 0 e 100';
    end if;
  elsif new.type = 'KOOS' then
    if new.score_format <> 'points_100' or new.value < 0 or new.value > 100
       or new.koos_subscale is null
       or new.koos_subscale not in ('pain', 'symptoms', 'adl', 'sport', 'qol') then
      raise exception 'KOOS: escolhe uma subescala e pontuação entre 0 e 100';
    end if;
  elsif new.type = 'NDI' then
    if not ((new.score_format = 'points_50' and new.value between 0 and 50 and new.value = trunc(new.value))
      or (new.score_format = 'percent_100' and new.value between 0 and 100)) then
      raise exception 'NDI: pontos inteiros de 0 a 50 ou percentagem de 0 a 100';
    end if;
  elsif new.type = 'RolandMorris' then
    if new.score_format <> 'points_24' or new.value < 0 or new.value > 24 or new.value <> trunc(new.value) then
      raise exception 'Roland-Morris: pontos inteiros de 0 a 24';
    end if;
  else
    raise exception 'Escala não suportada';
  end if;

  if new.type <> 'KOOS' and new.koos_subscale is not null then
    raise exception 'Subescala KOOS apenas para registos KOOS';
  end if;
  if new.session_id is not null and not exists (
    select 1 from public.session s
    where s.id = new.session_id and s.episode_id = new.episode_id and s.archived_at is null
  ) then
    raise exception 'A sessão selecionada não pertence a este episódio';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_scale_result() from public, anon, authenticated;
drop trigger if exists validate_scale_result on public.scale_result;
create trigger validate_scale_result
before insert or update of type, value, score_format, koos_subscale, session_id, episode_id
on public.scale_result for each row execute function private.validate_scale_result();
