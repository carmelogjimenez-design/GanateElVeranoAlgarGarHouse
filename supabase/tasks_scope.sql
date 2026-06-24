-- =====================================================================
-- MISIONES: alcance (equipo / todos / cualquiera) + colores por frecuencia
-- Requiere haber ejecutado antes seed_casa.sql (tareas y task_team_targets).
-- Pega en Supabase > SQL Editor > RUN.  (Seguro re-ejecutar)
-- =====================================================================

-- 1) Columna de alcance
alter table tasks add column if not exists scope text not null default 'team';
-- 'team'  -> aparece a los miembros del/los equipo(s) asignados (task_team_targets)
-- 'open'  -> misión disponible que CUALQUIERA puede coger (azul/rojo)

-- 2) Esquema del usuario por frecuencia:
--    diaria(verde) y 2/semana(amarillo) -> por equipo
--    cada 2 semanas(azul, media) y mensual(rojo, máxima) -> cualquiera
update tasks set scope = 'open'  where frequency in ('quincenal', 'mensual');
update tasks set scope = 'team'  where frequency in ('diaria', '2/semana', 'semanal');

-- Dificultad coherente con el color (rojo = máxima, azul = media, verde/amarillo según puntos)
update tasks set difficulty = 'dificil' where frequency = 'mensual';
update tasks set difficulty = 'media'   where frequency = 'quincenal';
update tasks set difficulty = 'facil'   where frequency = 'diaria';

-- 3) generate_missions: equipo + individuales + abiertas (una por tarea/día)
create or replace function generate_missions(p_date date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare n1 int := 0; n2 int := 0; n3 int := 0;
begin
  -- individuales (task_targets)
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, tt.kid_id, k.team_id, t.title, t.points, t.photo_required, p_date, 'todo'
  from task_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.id = tt.kid_id and k.active
  where freq_applies(t.frequency, p_date) and t.scope = 'team'
    and not exists (select 1 from assignments a where a.task_id = t.id and a.kid_id = tt.kid_id and a.due_date = p_date);
  get diagnostics n1 = row_count;

  -- por equipo (task_team_targets) -> cada miembro
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, k.id, k.team_id, t.title, t.points, t.photo_required, p_date, 'todo'
  from task_team_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.team_id = tt.team_id and k.active
  where freq_applies(t.frequency, p_date) and t.scope = 'team'
    and not exists (select 1 from assignments a where a.task_id = t.id and a.kid_id = k.id and a.due_date = p_date);
  get diagnostics n2 = row_count;

  -- abiertas (scope='open') -> UNA disponible para quien la coja
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, null, null, t.title, t.points, t.photo_required, p_date, 'open'
  from tasks t
  where t.active and t.scope = 'open' and freq_applies(t.frequency, p_date)
    and not exists (select 1 from assignments a where a.task_id = t.id and a.due_date = p_date);
  get diagnostics n3 = row_count;

  return n1 + n2 + n3;
end $$;
grant execute on function generate_missions(date) to authenticated;

-- 4) Coger una misión disponible (cualquiera) — la reclama el primero que la pille
create or replace function claim_mission(p_assignment uuid, p_kid uuid, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  select * into a from assignments where id = p_assignment for update;
  if a.id is null then raise exception 'No existe la misión'; end if;
  if a.kid_id is not null then raise exception 'Esa misión ya la cogió otro'; end if;
  update assignments
     set kid_id = p_kid, team_id = (select team_id from kids where id = p_kid), status = 'todo'
   where id = p_assignment and kid_id is null;
end $$;
grant execute on function claim_mission(uuid, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
