-- =====================================================================
-- GÁNATE EL VERANO — FASE 3 (Universo Estudio)
-- Recompensa por 1h de estudio (aprobada por padres) + ajustes
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- Ajustes de estudio
alter table settings add column if not exists study_reward_points int not null default 20;
alter table settings add column if not exists study_goal_seconds int not null default 3600;

-- Reclamaciones de recompensa de estudio (1 por día y por hijo)
create table if not exists study_rewards (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete cascade,
  day date not null,
  seconds int not null,
  points int not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  resolved_at timestamptz,
  unique (kid_id, day)
);
alter table study_rewards enable row level security;
create policy "read_study_rewards" on study_rewards for select using (true);
create policy "w_study_rewards" on study_rewards for all using (is_admin()) with check (is_admin());

-- El hijo reclama la recompensa del día si llegó al objetivo (PIN o admin)
create or replace function claim_study_reward(p_kid uuid, p_pin text, p_day date default current_date)
returns void language plpgsql security definer set search_path = public as $$
declare secs int; goal int; pts int; existing int;
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'No autorizado'; end if;
  select coalesce(sum(seconds), 0) into secs from study_sessions where kid_id = p_kid and created_at::date = p_day;
  select study_goal_seconds, study_reward_points into goal, pts from settings where id = 1;
  if secs < coalesce(goal, 3600) then raise exception 'Aún no has llegado al objetivo de hoy'; end if;
  select count(*) into existing from study_rewards where kid_id = p_kid and day = p_day;
  if existing > 0 then raise exception 'Ya has reclamado la recompensa de hoy'; end if;
  insert into study_rewards(kid_id, day, seconds, points) values (p_kid, p_day, secs, coalesce(pts, 20));
end $$;

-- Los padres aprueban / rechazan
create or replace function approve_study_reward(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r study_rewards%rowtype;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into r from study_rewards where id = p_id for update;
  if r.status <> 'pending' then return; end if;
  update study_rewards set status = 'approved', resolved_at = now() where id = p_id;
  insert into point_events(kid_id, delta, reason, type, ref_id) values (r.kid_id, r.points, 'Recompensa de estudio', 'task', r.id);
  perform award_badges(r.kid_id);
end $$;

create or replace function reject_study_reward(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  update study_rewards set status = 'rejected', resolved_at = now() where id = p_id and status = 'pending';
end $$;

grant execute on function claim_study_reward(uuid,text,date) to anon, authenticated;
grant execute on function approve_study_reward(uuid)         to authenticated;
grant execute on function reject_study_reward(uuid)          to authenticated;
