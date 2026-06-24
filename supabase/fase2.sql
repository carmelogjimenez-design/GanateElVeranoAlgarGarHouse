-- =====================================================================
-- GÁNATE EL VERANO — FASE 2 (tandas 5-7)
-- Insignias reales · Avatares desbloqueables · (animaciones = front)
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- ---------- Avatar elegido por el hijo ----------
alter table kids add column if not exists avatar text not null default '';

-- ---------- Catálogo de insignias ----------
create table if not exists badges_catalog (
  code text primary key,
  name text not null,
  description text not null,
  icon text not null,
  color text not null default '#FF8A00',
  sort int not null default 0
);

create table if not exists kid_badges (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete cascade,
  badge_code text references badges_catalog(code) on delete cascade,
  earned_at timestamptz default now(),
  unique (kid_id, badge_code)
);

alter table badges_catalog enable row level security;
alter table kid_badges enable row level security;
create policy "read_badges" on badges_catalog for select using (true);
create policy "w_badges" on badges_catalog for all using (is_admin()) with check (is_admin());
create policy "read_kid_badges" on kid_badges for select using (true);
create policy "w_kid_badges" on kid_badges for all using (is_admin()) with check (is_admin());

insert into badges_catalog(code,name,description,icon,color,sort) values
  ('first_mission','Primera misión','Completaste tu primera misión','target','#FF8A00',1),
  ('streak3','En racha','3 días distintos sumando puntos','flame','#EF4444',2),
  ('studious','Empollón','Tu primera sesión de estudio','brain','#8B5CF6',3),
  ('century','Centenario','Alcanza 100 puntos','star','#EAB308',4),
  ('consistent','Constante','10 misiones completadas','sparkles','#19D3AE',5),
  ('pro','Profesional','300 puntos acumulados','medal','#3B82F6',6),
  ('marathon','Maratón','1 hora total de estudio','timer','#06B6D4',7),
  ('legend','Leyenda','Llega al nivel 5','crown','#A855F7',8)
on conflict (code) do nothing;

-- ---------- Conceder insignias según los datos del hijo ----------
create or replace function award_badges(p_kid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare k kids%rowtype; approved int; days int; study int;
begin
  select * into k from kids where id = p_kid;
  if k.id is null then return; end if;
  select count(*) into approved from assignments where kid_id = p_kid and status = 'approved';
  select count(distinct (validated_at::date)) into days from assignments where kid_id = p_kid and status = 'approved' and validated_at is not null;
  select coalesce(sum(seconds),0) into study from study_sessions where kid_id = p_kid;

  if approved >= 1  then insert into kid_badges(kid_id,badge_code) values (p_kid,'first_mission') on conflict do nothing; end if;
  if days >= 3      then insert into kid_badges(kid_id,badge_code) values (p_kid,'streak3')       on conflict do nothing; end if;
  if study >= 1     then insert into kid_badges(kid_id,badge_code) values (p_kid,'studious')      on conflict do nothing; end if;
  if k.total_points >= 100 then insert into kid_badges(kid_id,badge_code) values (p_kid,'century') on conflict do nothing; end if;
  if approved >= 10 then insert into kid_badges(kid_id,badge_code) values (p_kid,'consistent')    on conflict do nothing; end if;
  if k.total_points >= 300 then insert into kid_badges(kid_id,badge_code) values (p_kid,'pro')     on conflict do nothing; end if;
  if study >= 3600  then insert into kid_badges(kid_id,badge_code) values (p_kid,'marathon')      on conflict do nothing; end if;
  if k.total_points >= 400 then insert into kid_badges(kid_id,badge_code) values (p_kid,'legend')  on conflict do nothing; end if;
end $$;
grant execute on function award_badges(uuid) to anon, authenticated;

-- ---------- Conceder insignias al validar / completar ----------
create or replace function approve_assignment(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id=p_assignment for update;
  if a.id is null or a.status='approved' then return; end if;
  update assignments set status='approved', validated_at=now() where id=p_assignment;
  insert into point_events(kid_id, delta, reason, type, ref_id) values (a.kid_id, a.points, 'Misión: '||a.title, 'task', a.id);
  perform award_badges(a.kid_id);
end $$;

create or replace function admin_complete(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id=p_assignment for update;
  if a.id is null or a.status='approved' then return; end if;
  update assignments set status='approved', completed_at=now(), validated_at=now() where id=p_assignment;
  insert into point_events(kid_id, delta, reason, type, ref_id) values (a.kid_id, a.points, 'Misión (por padre): '||a.title, 'task', a.id);
  perform award_badges(a.kid_id);
end $$;

-- ---------- El hijo elige avatar (PIN o admin) ----------
create or replace function set_avatar(p_kid uuid, p_pin text, p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'No autorizado'; end if;
  update kids set avatar = p_avatar where id = p_kid;
end $$;
grant execute on function set_avatar(uuid,text,text) to anon, authenticated;
