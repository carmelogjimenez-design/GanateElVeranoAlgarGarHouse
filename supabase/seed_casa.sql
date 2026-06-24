-- =====================================================================
-- GÁNATE EL VERANO — CARGA REAL (Casa Algar)
-- Equipos A/B/C/D · 5 jugadores sin móvil · tareas con frecuencia y equipo
-- Pega en Supabase > SQL Editor > RUN.  (Seguro re-ejecutar)
-- =====================================================================

-- 1) Equipos A/B/C/D (no duplica si ya existen)
insert into teams(name, color)
select v.name, v.color from (values
  ('Equipo A','#FF8A00'),('Equipo B','#3B82F6'),('Equipo C','#19D3AE'),('Equipo D','#A855F7')
) v(name,color)
where not exists (select 1 from teams t where t.name = v.name);

-- 2) Asignación por EQUIPO de una tarea recurrente
create table if not exists task_team_targets (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  unique (task_id, team_id)
);
alter table task_team_targets enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='task_team_targets' and policyname='read_ttt')
    then create policy "read_ttt" on task_team_targets for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='task_team_targets' and policyname='w_ttt')
    then create policy "w_ttt" on task_team_targets for all using (is_admin()) with check (is_admin()); end if;
end $$;

-- generate_missions ahora también genera para los miembros de los equipos asignados
create or replace function generate_missions(p_date date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare n1 int := 0; n2 int := 0;
begin
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, tt.kid_id, k.team_id, t.title, t.points, t.photo_required, p_date, 'todo'
  from task_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.id = tt.kid_id and k.active
  where freq_applies(t.frequency, p_date)
    and not exists (select 1 from assignments a where a.task_id = t.id and a.kid_id = tt.kid_id and a.due_date = p_date);
  get diagnostics n1 = row_count;

  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, k.id, k.team_id, t.title, t.points, t.photo_required, p_date, 'todo'
  from task_team_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.team_id = tt.team_id and k.active
  where freq_applies(t.frequency, p_date)
    and not exists (select 1 from assignments a where a.task_id = t.id and a.kid_id = k.id and a.due_date = p_date);
  get diagnostics n2 = row_count;
  return n1 + n2;
end $$;
grant execute on function generate_missions(date) to authenticated;

-- 3) Jugadores SIN móvil (se borran los de PIN actuales y se crean limpios; los registrados por email se conservan)
delete from kids where user_id is null;
insert into kids(name, pin, color, team_id, status, app_access)
select v.name, '1111', v.color, (select id from teams where name = v.tname), 'active', true
from (values
  ('Elena','#EC4899','Equipo A'),
  ('Gloria','#22C55E','Equipo B'),
  ('Belén','#EAB308','Equipo C'),
  ('Gabriel','#06B6D4','Equipo D'),
  ('Ceci','#EF4444','Equipo D')
) v(name,color,tname);

-- 4) Catálogo de tareas (no duplica por título)
insert into tasks(title, frequency, difficulty, points, photo_required)
select v.title, v.frequency, v.difficulty, v.points, false from (values
  ('SALÓN 2 (barrer, fregar y pasar el polvo)','2/semana','facil',1),
  ('BAÑO C/I','2/semana','facil',1),
  ('BAÑO L/M','2/semana','facil',1),
  ('BAÑO SÓTANO','2/semana','facil',1),
  ('BAÑO P/M','2/semana','facil',1),
  ('LATERAL + PALMERA + ENTRADA','2/semana','media',3),
  ('LAVANDERÍA','2/semana','media',3),
  ('BARBACOA + GARAGE','2/semana','media',3),
  ('COCINA FONDO','mensual','dificil',10),
  ('SALÓN FONDO','mensual','dificil',8),
  ('SÓTANO FONDO','mensual','dificil',8),
  ('PUERTAS FONDO','quincenal','media',5),
  ('CRISTALES FONDO','quincenal','media',5),
  ('HABITACIONES','diaria','facil',1),
  ('SALÓN 1 (barrer y fregar)','diaria','facil',1),
  ('ENTRADA + ESCALERAS + DISTRIBUIDOR 1ª PLANTA (barrer y fregar)','diaria','facil',1),
  ('TRASERA + TERRAZA (barrer, fregar y recoger)','diaria','facil',1),
  ('PISCINA','diaria','facil',1)
) v(title,frequency,difficulty,points)
where not exists (select 1 from tasks t where t.title = v.title);

-- 5) Asignación de cada tarea a su(s) equipo(s)
insert into task_team_targets(task_id, team_id)
select t.id, te.id from (values
  ('SALÓN 2 (barrer, fregar y pasar el polvo)','Equipo A'),
  ('BAÑO SÓTANO','Equipo A'),
  ('PISCINA','Equipo A'),
  ('BAÑO P/M','Equipo B'),
  ('LATERAL + PALMERA + ENTRADA','Equipo B'),
  ('TRASERA + TERRAZA (barrer, fregar y recoger)','Equipo B'),
  ('BAÑO C/I','Equipo C'),
  ('BARBACOA + GARAGE','Equipo C'),
  ('ENTRADA + ESCALERAS + DISTRIBUIDOR 1ª PLANTA (barrer y fregar)','Equipo C'),
  ('BAÑO L/M','Equipo D'),
  ('LAVANDERÍA','Equipo D'),
  ('SALÓN 1 (barrer y fregar)','Equipo D'),
  ('HABITACIONES','Equipo A'),('HABITACIONES','Equipo B'),('HABITACIONES','Equipo C'),('HABITACIONES','Equipo D')
) m(title, tname)
join tasks t on t.title = m.title
join teams te on te.name = m.tname
where not exists (select 1 from task_team_targets x where x.task_id = t.id and x.team_id = te.id);

notify pgrst, 'reload schema';
