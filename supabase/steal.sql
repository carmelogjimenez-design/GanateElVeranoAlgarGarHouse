-- ============================================================
-- ROBAR TAREAS DE OTRO EQUIPO + NOTIFICACIONES
-- Un hijo SIN tareas propias pendientes puede robar una tarea de
-- equipo de OTRO equipo que aún no esté hecha. La hace y la validas
-- normal (con foto si la pide); se queda los puntos. Al equipo robado
-- se le avisa y deja de poder ganar esos puntos (NUNCA pierde).
-- Requiere haber ejecutado cooldown.sql antes. Seguro re-ejecutar.
-- ============================================================

-- 1) Tabla de notificaciones
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete cascade,
  type text default 'info',
  title text,
  body text,
  read boolean not null default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='read_notif')
    then create policy "read_notif" on notifications for select using (true); end if;
end $$;

-- 2) Marca de origen del robo en la asignación
alter table assignments add column if not exists stolen_from_team uuid;

-- 3) Marcar como leídas las notificaciones de un hijo
create or replace function read_notifications(p_kid uuid, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  update notifications set read = true where kid_id = p_kid and not read;
end $$;
grant execute on function read_notifications(uuid, text) to anon, authenticated;

-- 4) generate_missions: además del cooldown, NO repone lo robado (status 'stolen')
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
    and not exists (select 1 from assignments a where a.task_id=t.id and a.kid_id=tt.kid_id and a.status in ('todo','pending','rejected'))
    and not exists (select 1 from assignments a where a.task_id=t.id and a.kid_id=tt.kid_id and a.status in ('approved','stolen')
                      and coalesce(a.validated_at, a.completed_at, a.created_at) + cooldown_interval(t.frequency) > now());
  get diagnostics n1 = row_count;

  -- POR EQUIPO (task_team_targets) -> cada miembro
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, k.id, k.team_id, t.title, t.points, t.photo_required, current_date, 'todo'
  from task_team_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.team_id = tt.team_id and k.active
  where t.scope = 'team'
    and not exists (select 1 from assignments a where a.task_id=t.id and a.kid_id=k.id and a.status in ('todo','pending','rejected'))
    and not exists (select 1 from assignments a where a.task_id=t.id and a.kid_id=k.id and a.status in ('approved','stolen')
                      and coalesce(a.validated_at, a.completed_at, a.created_at) + cooldown_interval(t.frequency) > now());
  get diagnostics n2 = row_count;

  -- ABIERTAS (scope='open')
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, null, null, t.title, t.points, t.photo_required, current_date, 'open'
  from tasks t
  where t.active and t.scope = 'open'
    and not exists (select 1 from assignments a where a.task_id=t.id and a.status in ('open','todo','pending','rejected'))
    and not exists (select 1 from assignments a where a.task_id=t.id and a.status in ('approved','stolen')
                      and coalesce(a.validated_at, a.completed_at, a.created_at) + cooldown_interval(t.frequency) > now());
  get diagnostics n3 = row_count;

  return n1 + n2 + n3;
end $$;
grant execute on function generate_missions(date) to authenticated;

-- 5) Robar una tarea de otro equipo
create or replace function steal_assignment(p_assignment uuid, p_kid uuid, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype; v_team uuid; v_victim_team uuid; v_kidname text;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;

  -- el ladrón no puede tener tareas propias pendientes
  if exists (select 1 from assignments x where x.kid_id = p_kid and x.status in ('todo','rejected') and coalesce(x.expired,false) = false) then
    raise exception 'Acaba tus tareas antes de robar';
  end if;

  select * into a from assignments where id = p_assignment for update;
  if a.id is null or a.status <> 'todo' or a.kid_id is null then raise exception 'Esa tarea ya no se puede robar'; end if;

  select team_id into v_team from kids where id = p_kid;
  select team_id into v_victim_team from kids where id = a.kid_id;
  if v_victim_team is null or v_victim_team = v_team then raise exception 'No puedes robar a tu propio equipo'; end if;

  select name into v_kidname from kids where id = p_kid;

  -- 1) congela la del equipo robado: no la repondrá la generación durante el cooldown
  update assignments set status = 'stolen', completed_at = now() where id = a.id;

  -- 2) crea la tarea para el ladrón (la hará y la validas normal)
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status, stolen_from_team)
  values (a.task_id, p_kid, v_team, a.title, a.points, a.photo_required, current_date, 'todo', v_victim_team);

  -- 3) avisa a los miembros del equipo robado
  insert into notifications(kid_id, type, title, body)
  select k.id, 'steal', 'Te han robado una tarea',
         v_kidname || ' ha cogido «' || a.title || '». Dejas de ganar ' || a.points || ' pts.'
  from kids k where k.team_id = v_victim_team and k.active and k.id <> p_kid;
end $$;
grant execute on function steal_assignment(uuid, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
