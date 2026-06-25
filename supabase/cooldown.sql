-- ============================================================
-- MISIONES CONGELADAS · cooldown rodante por tiempo
-- Cada misión, al hacerse, se congela y NO se regenera hasta que
-- pasa su tiempo: diaria 24h · 2/semana 3d · semanal 7d ·
-- quincenal 15d · mensual 30d. Sustituye la generación por
-- calendario (freq_applies) por una basada en "última vez hecha".
-- Seguro re-ejecutar.
-- ============================================================

-- 1) Tiempo de cooldown por frecuencia
create or replace function cooldown_interval(p_freq text)
returns interval language sql immutable as $$
  select case p_freq
    when 'diaria'    then interval '24 hours'
    when '2/semana'  then interval '3 days'
    when 'semanal'   then interval '7 days'
    when 'quincenal' then interval '15 days'
    when 'mensual'   then interval '30 days'
    else interval '0'
  end;
$$;
grant execute on function cooldown_interval(text) to anon, authenticated;

-- 2) generate_missions ROLLING: crea una misión solo si NO hay una activa
--    (todo/pending/rejected) y NO está dentro del cooldown desde la última
--    vez aprobada. Cubre individuales, por equipo y abiertas.
create or replace function generate_missions(p_date date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare n1 int := 0; n2 int := 0; n3 int := 0;
begin
  -- INDIVIDUALES (task_targets), scope = team
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, tt.kid_id, k.team_id, t.title, t.points, t.photo_required, current_date, 'todo'
  from task_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.id = tt.kid_id and k.active
  where t.scope = 'team'
    and not exists (
      select 1 from assignments a
      where a.task_id = t.id and a.kid_id = tt.kid_id
        and a.status in ('todo', 'pending', 'rejected')
    )
    and not exists (
      select 1 from assignments a
      where a.task_id = t.id and a.kid_id = tt.kid_id and a.status = 'approved'
        and coalesce(a.validated_at, a.completed_at, a.created_at) + cooldown_interval(t.frequency) > now()
    );
  get diagnostics n1 = row_count;

  -- POR EQUIPO (task_team_targets) -> cada miembro
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, k.id, k.team_id, t.title, t.points, t.photo_required, current_date, 'todo'
  from task_team_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.team_id = tt.team_id and k.active
  where t.scope = 'team'
    and not exists (
      select 1 from assignments a
      where a.task_id = t.id and a.kid_id = k.id
        and a.status in ('todo', 'pending', 'rejected')
    )
    and not exists (
      select 1 from assignments a
      where a.task_id = t.id and a.kid_id = k.id and a.status = 'approved'
        and coalesce(a.validated_at, a.completed_at, a.created_at) + cooldown_interval(t.frequency) > now()
    );
  get diagnostics n2 = row_count;

  -- ABIERTAS (scope='open') -> UNA disponible por tarea
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, null, null, t.title, t.points, t.photo_required, current_date, 'open'
  from tasks t
  where t.active and t.scope = 'open'
    and not exists (
      select 1 from assignments a
      where a.task_id = t.id and a.status in ('open', 'todo', 'pending', 'rejected')
    )
    and not exists (
      select 1 from assignments a
      where a.task_id = t.id and a.status = 'approved'
        and coalesce(a.validated_at, a.completed_at, a.created_at) + cooldown_interval(t.frequency) > now()
    );
  get diagnostics n3 = row_count;

  return n1 + n2 + n3;
end $$;
grant execute on function generate_missions(date) to authenticated;

notify pgrst, 'reload schema';
