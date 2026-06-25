-- =====================================================================
-- TAREA ESPECIAL · SACAR A MILO (paseo del perro)
-- Mínimo 2 veces/día · puntos por duración · doble foto (salir/volver)
-- 20min=1 · 35min=2 · 60min=3 · 90min=5
-- =====================================================================
create table if not exists milo_walks (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete set null,
  day date not null default current_date,
  started_at timestamptz not null default now(),
  start_photo text,
  ended_at timestamptz,
  end_photo text,
  minutes int,
  points int,
  status text not null default 'in_progress' check (status in ('in_progress','done')),
  created_at timestamptz default now()
);
alter table milo_walks enable row level security;
drop policy if exists milo_read on milo_walks;
drop policy if exists milo_write on milo_walks;
create policy milo_read  on milo_walks for select using (true);
create policy milo_write on milo_walks for all using (true) with check (true);

-- Puntos según minutos
create or replace function milo_points(p_min int)
returns int language sql immutable as $$
  select case when p_min >= 90 then 5 when p_min >= 60 then 3 when p_min >= 35 then 2 when p_min >= 20 then 1 else 0 end;
$$;

-- EMPEZAR el paseo (foto de salida obligatoria)
create or replace function start_milo(p_kid uuid, p_photo text, p_pin text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare wid uuid;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  if exists (select 1 from milo_walks where status = 'in_progress') then
    raise exception 'Ya hay un paseo de Milo en marcha';
  end if;
  insert into milo_walks(kid_id, start_photo) values (p_kid, p_photo) returning id into wid;
  return wid;
end $$;

-- TERMINAR el paseo (foto de vuelta obligatoria) -> calcula minutos y puntos
create or replace function finish_milo(p_walk uuid, p_photo text, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare w milo_walks%rowtype; mins int; pts int;
begin
  select * into w from milo_walks where id = p_walk;
  if w.id is null or w.status = 'done' then return; end if;
  if not can_act(w.kid_id, p_pin) then raise exception 'No autorizado'; end if;
  mins := greatest(0, round(extract(epoch from (now() - w.started_at)) / 60)::int);
  pts  := milo_points(mins);
  update milo_walks set ended_at = now(), end_photo = p_photo, minutes = mins, points = pts, status = 'done' where id = p_walk;
  if pts > 0 then
    insert into point_events(kid_id, delta, reason, type) values (w.kid_id, pts, 'Paseo con Milo (' || mins || ' min)', 'task');
    perform award_badges(w.kid_id);
  end if;
end $$;

grant execute on function milo_points(int) to anon, authenticated;
grant execute on function start_milo(uuid, text, text) to anon, authenticated;
grant execute on function finish_milo(uuid, text, text) to anon, authenticated;
notify pgrst, 'reload schema';
