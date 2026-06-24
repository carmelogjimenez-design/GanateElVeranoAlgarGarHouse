-- =====================================================================
-- GÁNATE EL VERANO — FASE 1 (tandas 1-4)
-- Metas editables · Catálogo + recurrencia · Evidencia foto · Sin móvil/tutor
-- Pega TODO en Supabase > SQL Editor > RUN (una vez).
-- =====================================================================

-- ---------- Columnas nuevas en kids ----------
alter table kids add column if not exists weekly_goal int not null default 100;
alter table kids add column if not exists can_tutor boolean not null default false;
alter table kids add column if not exists app_access boolean not null default true;

-- ---------- Ajustes globales (objetivo equipo, reto) ----------
create table if not exists settings (
  id int primary key default 1,
  team_goal int not null default 200,
  challenge_label text default 'Reto de equipo',
  challenge_until date,
  weekly_goal_default int not null default 100,
  single_row boolean not null default true,
  constraint settings_one_row check (id = 1)
);
insert into settings(id) values (1) on conflict (id) do nothing;
update settings set challenge_until = current_date + 7 where challenge_until is null;

-- ---------- Misiones recurrentes: a quién se asigna cada tarea ----------
create table if not exists task_targets (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  kid_id uuid references kids(id) on delete cascade,
  created_at timestamptz default now(),
  unique (task_id, kid_id)
);

-- ---------- RLS de las tablas nuevas ----------
alter table settings enable row level security;
alter table task_targets enable row level security;
create policy "read_settings" on settings for select using (true);
create policy "w_settings" on settings for all using (is_admin()) with check (is_admin());
create policy "read_task_targets" on task_targets for select using (true);
create policy "w_task_targets" on task_targets for all using (is_admin()) with check (is_admin());

-- ---------- ¿La frecuencia aplica a esta fecha? ----------
create or replace function freq_applies(p_freq text, p_date date)
returns boolean language sql immutable as $$
  select case p_freq
    when 'diaria'    then true
    when '2/semana'  then extract(dow from p_date) in (1, 4)              -- lunes y jueves
    when 'semanal'   then extract(dow from p_date) = 1                    -- lunes
    when 'quincenal' then extract(dow from p_date) = 1 and (extract(week from p_date)::int % 2 = 1)
    when 'mensual'   then extract(day from p_date) = 1                    -- día 1
    else false                                                            -- personalizada: solo manual
  end;
$$;

-- ---------- Generar las misiones recurrentes de un día (idempotente) ----------
create or replace function generate_missions(p_date date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  insert into assignments(task_id, kid_id, team_id, title, points, photo_required, due_date, status)
  select t.id, tt.kid_id, k.team_id, t.title, t.points, t.photo_required, p_date, 'todo'
  from task_targets tt
  join tasks t on t.id = tt.task_id and t.active
  join kids k on k.id = tt.kid_id and k.active
  where freq_applies(t.frequency, p_date)
    and not exists (select 1 from assignments a where a.task_id = t.id and a.kid_id = tt.kid_id and a.due_date = p_date);
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- Completar misión por el hijo (hijos sin móvil) ----------
create or replace function admin_complete(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id = p_assignment for update;
  if a.id is null or a.status = 'approved' then return; end if;
  update assignments set status = 'approved', completed_at = now(), validated_at = now() where id = p_assignment;
  insert into point_events(kid_id, delta, reason, type, ref_id) values (a.kid_id, a.points, 'Misión (por padre): ' || a.title, 'task', a.id);
end $$;

-- ---------- Un hermano tutor marca la misión de otro ----------
create or replace function tutor_mark_done(p_tutor uuid, p_pin text, p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not kid_pin_ok(p_tutor, p_pin) then raise exception 'PIN incorrecto'; end if;
  if not exists (select 1 from kids where id = p_tutor and can_tutor) then raise exception 'No eres tutor'; end if;
  update assignments set status = 'pending', completed_at = now()
   where id = p_assignment and status in ('todo', 'rejected');
end $$;

grant execute on function generate_missions(date)               to authenticated;
grant execute on function admin_complete(uuid)                   to authenticated;
grant execute on function tutor_mark_done(uuid,text,uuid)        to anon, authenticated;
grant execute on function freq_applies(text,date)                to anon, authenticated;

-- ---------- Storage: bucket para evidencias fotográficas ----------
insert into storage.buckets (id, name, public) values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ev_read')
    then create policy "ev_read" on storage.objects for select using (bucket_id = 'evidencias'); end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='ev_insert')
    then create policy "ev_insert" on storage.objects for insert with check (bucket_id = 'evidencias'); end if;
end $$;

-- ---------- Catálogo de misiones del brief (no duplica si ya existen) ----------
insert into tasks(title, description, category, frequency, difficulty, points)
select v.title, v.description, v.category, v.frequency, v.difficulty, v.points
from (values
  ('Base operativa asegurada','Tu habitación recogida y cama hecha','habitacion','diaria','facil',1),
  ('Conquista la cocina','Recoger y dejar la cocina impecable','cocina','diaria','media',3),
  ('Operación piscina','Limpiar y ordenar la zona de piscina','piscina','diaria','media',3),
  ('Salón principal','Ordenar el salón principal','salon','diaria','facil',2),
  ('Entrada y escaleras','Despejar entrada y escaleras','entrada','diaria','facil',2),
  ('Terraza a punto','Recoger y barrer la terraza','terraza','diaria','facil',2),
  ('Misión baño','Limpiar un baño a fondo','banos','2/semana','media',3),
  ('Lavandería al poder','Poner, tender y recoger una colada','lavanderia','2/semana','media',3),
  ('Salón secundario','Ordenar el salón secundario','salon','2/semana','facil',2),
  ('Barbacoa lista','Limpiar la zona de barbacoa','barbacoa','2/semana','media',3),
  ('Garaje ordenado','Ordenar el garaje','garaje','2/semana','media',4),
  ('Cristales relucientes','Limpiar cristales sin marcas','cristales','quincenal','dificil',5),
  ('Puertas impecables','Limpiar puertas','puertas','quincenal','facil',3),
  ('Cocina a fondo','Limpieza profunda de la cocina','cocina','mensual','dificil',10),
  ('Salón a fondo','Limpieza profunda del salón','salon','mensual','dificil',8),
  ('Sótano a fondo','Ordenar y limpiar el sótano','sotano','mensual','dificil',8)
) as v(title,description,category,frequency,difficulty,points)
where not exists (select 1 from tasks t where t.title = v.title);
