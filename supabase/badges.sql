-- =====================================================================
-- MEDALLAS: catálogo amplio + desbloqueo automático por criterios
-- Pega en Supabase > SQL Editor > RUN.  (Seguro re-ejecutar)
-- =====================================================================

-- 1) Criterios en el catálogo
alter table badges_catalog add column if not exists criteria_type text default 'points';
alter table badges_catalog add column if not exists criteria_value numeric default 1;

-- 2) Catálogo de medallas (upsert por código)
insert into badges_catalog (code, name, description, icon, color, sort, criteria_type, criteria_value) values
  ('primer_paso',   'Primer paso',        'Completa tu primera misión',       'flag',     '#22C55E',  1, 'tasks',        1),
  ('manitas',       'Manitas',            'Completa 10 misiones',             'sparkles', '#14B8A6',  2, 'tasks',        10),
  ('currante',      'Currante',           'Completa 25 misiones',             'dumbbell', '#0EA5E9',  3, 'tasks',        25),
  ('maquina',       'Máquina',            'Completa 50 misiones',             'zap',      '#F59E0B',  4, 'tasks',        50),
  ('leyenda_tareas','Leyenda del hogar',  'Completa 100 misiones',            'crown',    '#EAB308',  5, 'tasks',        100),
  ('cerebrito',     'Cerebrito',          'Haz tu primer test',               'brain',    '#8B5CF6',  6, 'tests',        1),
  ('estudioso',     'Estudioso',          'Completa 10 tests',                'book',     '#6366F1',  7, 'tests',        10),
  ('sabio',         'Sabio',              'Completa 30 tests',                'gem',      '#7C3AED',  8, 'tests',        30),
  ('primera_hora',  'Primera hora',       'Estudia 1 hora en total',          'timer',    '#06B6D4',  9, 'study_hours',  1),
  ('maraton',       'Maratón de estudio', 'Estudia 10 horas en total',        'sun',      '#0891B2', 10, 'study_hours',  10),
  ('constante',     'Constante',          'Activo 3 días distintos',          'flame',    '#F97316', 11, 'days',         3),
  ('imparable',     'Imparable',          'Activo 7 días distintos',          'flame',    '#DC2626', 12, 'days',         7),
  ('centurion',     'Centurión',          'Consigue 100 XP',                  'star',     '#FB923C', 13, 'points',       100),
  ('quinientos',    'Quinientos',         'Consigue 500 XP',                  'medal',    '#FBBF24', 14, 'points',       500),
  ('mil_xp',        'Mil puntos',         'Consigue 1000 XP',                 'trophy',   '#F59E0B', 15, 'points',       1000),
  ('estrella',      'Estrella del verano','Consigue 2000 XP',                 'crown',    '#A855F7', 16, 'points',       2000),
  ('nivel5',        'Nivel 5',            'Alcanza el nivel 5',               'shield',   '#10B981', 17, 'level',        5),
  ('nivel10',       'Nivel 10',           'Alcanza el nivel 10',              'shield',   '#059669', 18, 'level',        10),
  ('comprador',     'Comprador',          'Canjea tu primer premio',          'heart',    '#EC4899', 19, 'rewards',      1)
on conflict (code) do update set
  name = excluded.name, description = excluded.description, icon = excluded.icon,
  color = excluded.color, sort = excluded.sort,
  criteria_type = excluded.criteria_type, criteria_value = excluded.criteria_value;

-- 3) Evitar duplicados al conceder
create unique index if not exists kid_badges_uniq on kid_badges(kid_id, badge_code);

-- 4) Concesión automática genérica según criterios
create or replace function award_badges(p_kid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_points int; v_level int; v_tasks int; v_study numeric; v_tests int; v_days int; v_rewards int;
  b record; v numeric;
begin
  select coalesce(total_points, 0) into v_points from kids where id = p_kid;
  v_level := floor(v_points / 100.0) + 1;
  select count(*) into v_tasks   from point_events where kid_id = p_kid and type = 'task' and delta > 0;
  select coalesce(sum(seconds), 0) / 3600.0 into v_study from study_sessions where kid_id = p_kid;
  select count(*) into v_tests   from test_sessions where kid_id = p_kid;
  select count(distinct (created_at)::date) into v_days from point_events where kid_id = p_kid and delta > 0;
  select count(*) into v_rewards from redemptions where kid_id = p_kid and status = 'approved';

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

-- 5) Re-evaluar a todos ahora (enciende lo ya conseguido)
do $$ declare k record; begin
  for k in select id from kids loop perform award_badges(k.id); end loop;
end $$;

notify pgrst, 'reload schema';
