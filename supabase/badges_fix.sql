-- ============================================================
-- FIX MEDALLAS · Gánate el Verano
-- Problema: convivían 2 versiones de award_badges con códigos
-- distintos. La vieja insertaba 'first_mission', 'century'... que
-- NO existen en el catálogo nuevo de 19 medallas, así que el panel
-- del hijo mostraba siempre 0/19.
-- Este script: catálogo correcto + función canónica + limpieza de
-- medallas huérfanas + re-concesión a todos según su progreso real.
-- Es idempotente: se puede ejecutar las veces que haga falta.
-- ============================================================

-- 1) Asegura columnas de criterio
alter table badges_catalog add column if not exists criteria_type  text    default 'points';
alter table badges_catalog add column if not exists criteria_value numeric default 1;

-- 2) Catálogo correcto (19 medallas) — upsert por código
insert into badges_catalog (code, name, description, icon, color, sort, criteria_type, criteria_value) values
  ('primer_paso',   'Primer paso',        'Completa tu primera misión',  'flag',     '#22C55E',  1, 'tasks',        1),
  ('manitas',       'Manitas',            'Completa 10 misiones',        'sparkles', '#14B8A6',  2, 'tasks',        10),
  ('currante',      'Currante',           'Completa 25 misiones',        'dumbbell', '#0EA5E9',  3, 'tasks',        25),
  ('maquina',       'Máquina',            'Completa 50 misiones',        'zap',      '#F59E0B',  4, 'tasks',        50),
  ('leyenda_tareas','Leyenda del hogar',  'Completa 100 misiones',       'crown',    '#EAB308',  5, 'tasks',        100),
  ('cerebrito',     'Cerebrito',          'Haz tu primer test',          'brain',    '#8B5CF6',  6, 'tests',        1),
  ('estudioso',     'Estudioso',          'Completa 10 tests',           'book',     '#6366F1',  7, 'tests',        10),
  ('sabio',         'Sabio',              'Completa 30 tests',           'gem',      '#7C3AED',  8, 'tests',        30),
  ('primera_hora',  'Primera hora',       'Estudia 1 hora en total',     'timer',    '#06B6D4',  9, 'study_hours',  1),
  ('maraton',       'Maratón de estudio', 'Estudia 10 horas en total',   'sun',      '#0891B2', 10, 'study_hours',  10),
  ('constante',     'Constante',          'Activo 3 días distintos',     'flame',    '#F97316', 11, 'days',         3),
  ('imparable',     'Imparable',          'Activo 7 días distintos',     'flame',    '#DC2626', 12, 'days',         7),
  ('centurion',     'Centurión',          'Consigue 100 XP',             'star',     '#FB923C', 13, 'points',       100),
  ('quinientos',    'Quinientos',         'Consigue 500 XP',             'medal',    '#FBBF24', 14, 'points',       500),
  ('mil_xp',        'Mil puntos',         'Consigue 1000 XP',            'trophy',   '#F59E0B', 15, 'points',       1000),
  ('estrella',      'Estrella del verano','Consigue 2000 XP',            'crown',    '#A855F7', 16, 'points',       2000),
  ('nivel5',        'Nivel 5',            'Alcanza el nivel 5',          'shield',   '#10B981', 17, 'level',        5),
  ('nivel10',       'Nivel 10',           'Alcanza el nivel 10',         'shield',   '#059669', 18, 'level',        10),
  ('comprador',     'Comprador',          'Canjea tu primer premio',     'heart',    '#EC4899', 19, 'rewards',      1)
on conflict (code) do update set
  name = excluded.name, description = excluded.description, icon = excluded.icon,
  color = excluded.color, sort = excluded.sort,
  criteria_type = excluded.criteria_type, criteria_value = excluded.criteria_value;

-- 3) Función canónica (códigos del catálogo de 19)
create or replace function award_badges(p_kid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_points int; v_level int; v_tasks int; v_study numeric; v_tests int; v_days int; v_rewards int;
  b record; v numeric;
begin
  select coalesce(total_points, 0) into v_points from kids where id = p_kid;
  v_level := floor(v_points / 100.0) + 1;

  -- misiones completadas: eventos de tipo 'task'. Si no hubiera (datos antiguos),
  -- cae a las asignaciones aprobadas como red de seguridad.
  select count(*) into v_tasks from point_events where kid_id = p_kid and type = 'task' and delta > 0;
  if v_tasks = 0 then
    select count(*) into v_tasks from assignments where kid_id = p_kid and status = 'approved';
  end if;

  select coalesce(sum(seconds), 0) / 3600.0 into v_study  from study_sessions where kid_id = p_kid;
  select count(*)                          into v_tests  from test_sessions  where kid_id = p_kid;
  select count(distinct (created_at)::date) into v_days   from point_events   where kid_id = p_kid and delta > 0;
  select count(*)                          into v_rewards from redemptions    where kid_id = p_kid and status = 'approved';

  for b in select * from badges_catalog loop
    v := case b.criteria_type
      when 'points'      then v_points
      when 'level'       then v_level
      when 'tasks'       then v_tasks
      when 'study_hours' then v_study
      when 'tests'       then v_tests
      when 'days'        then v_days
      when 'rewards'     then v_rewards
      else 0 end;
    if v >= coalesce(b.criteria_value, 1)
       and not exists (select 1 from kid_badges where kid_id = p_kid and badge_code = b.code) then
      insert into kid_badges(kid_id, badge_code) values (p_kid, b.code) on conflict do nothing;
    end if;
  end loop;
end $$;
grant execute on function award_badges(uuid) to anon, authenticated;

-- 4) Limpia medallas huérfanas (códigos viejos que ya no existen en el catálogo)
delete from kid_badges kb
where not exists (select 1 from badges_catalog c where c.code = kb.badge_code);

-- 5) Re-concede a TODOS los hijos según su progreso real
do $$ declare k record; begin
  for k in select id from kids loop perform award_badges(k.id); end loop;
end $$;

-- 6) Diagnóstico: medallas por hijo tras el fix
select kids.name, count(kb.*) as medallas
from kids
left join kid_badges kb on kb.kid_id = kids.id
group by kids.name
order by medallas desc, kids.name;

notify pgrst, 'reload schema';
