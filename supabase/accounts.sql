-- =====================================================================
-- GÁNATE EL VERANO — CUENTAS POR EMAIL + AUTORIZACIÓN CON EQUIPO
-- El hijo con móvil se registra con su email; los padres lo autorizan y
-- le asignan equipo. Las acciones del hijo funcionan con su sesión (sin PIN).
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- Vínculo hijo <-> cuenta + estado de alta
alter table kids add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table kids add column if not exists status text not null default 'active';

-- ¿La cuenta actual es dueña de este hijo?
create or replace function kid_owner_ok(p_kid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from kids where id = p_kid and user_id = auth.uid());
$$;
-- ¿Puede actuar como este hijo? (PIN correcto, o admin, o dueño de la cuenta)
create or replace function can_act(p_kid uuid, p_pin text)
returns boolean language sql stable security definer set search_path = public as $$
  select kid_pin_ok(p_kid, p_pin) or is_admin() or kid_owner_ok(p_kid);
$$;
grant execute on function kid_owner_ok(uuid) to anon, authenticated;
grant execute on function can_act(uuid,text) to anon, authenticated;

-- El hijo se da de alta (queda pendiente hasta que los padres lo autoricen)
create or replace function register_kid(p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare colors text[] := array['#FF8A00','#19D3AE','#3B82F6','#A855F7','#EC4899','#22C55E','#EAB308','#EF4444'];
begin
  if exists (select 1 from kids where user_id = auth.uid()) then return; end if;
  insert into kids(name, pin, color, status, user_id, app_access)
  values (coalesce(nullif(p_name,''),'Peque'), null, colors[1 + floor(random()*8)::int], 'pending', auth.uid(), true);
end $$;
grant execute on function register_kid(text) to authenticated;

-- Los padres autorizan y asignan equipo
create or replace function approve_kid(p_kid uuid, p_team uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  update kids set status = 'active', team_id = p_team where id = p_kid;
end $$;
grant execute on function approve_kid(uuid,uuid) to authenticated;

-- ---------- Recrear las RPC de hijo para que acepten al dueño de la cuenta ----------
do $$ declare r record; fn text; begin
  foreach fn in array array['mark_done','request_redemption','request_gift','log_study','claim_study_reward','set_avatar','finish_test','tutor_mark_done','request_custom_reward'] loop
    for r in select oid::regprocedure as sig from pg_proc where proname = fn and pronamespace = 'public'::regnamespace loop
      execute 'drop function ' || r.sig || ' cascade';
    end loop;
  end loop;
end $$;

create or replace function mark_done(p_assignment uuid, p_kid uuid, p_pin text default null, p_note text default null, p_photo text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  update assignments set status='pending', completed_at=now(), note=coalesce(p_note,note), photo_url=coalesce(p_photo,photo_url)
   where id=p_assignment and kid_id=p_kid and status in ('todo','rejected');
end $$;

create or replace function request_redemption(p_kid uuid, p_reward uuid, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r rewards%rowtype; k kids%rowtype;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  select * into r from rewards where id=p_reward and active;
  select * into k from kids where id=p_kid;
  if r.id is null then raise exception 'Recompensa no disponible'; end if;
  if k.total_points < r.cost then raise exception 'No tienes puntos suficientes'; end if;
  insert into redemptions(kid_id, reward_id, title, cost) values (p_kid, r.id, r.title, r.cost);
end $$;

create or replace function request_gift(p_from uuid, p_to uuid, p_points int, p_reason text default '', p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare k kids%rowtype;
begin
  if not can_act(p_from, p_pin) then raise exception 'No autorizado'; end if;
  if p_points <= 0 then raise exception 'Puntos no válidos'; end if;
  if p_from = p_to then raise exception 'No puedes regalarte a ti mismo'; end if;
  select * into k from kids where id=p_from;
  if k.total_points < p_points then raise exception 'No tienes puntos suficientes'; end if;
  insert into gifts(from_kid, to_kid, points, reason) values (p_from, p_to, p_points, p_reason);
end $$;

create or replace function log_study(p_kid uuid, p_subject uuid, p_seconds int, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  if p_seconds <= 0 then return; end if;
  insert into study_sessions(kid_id, subject_id, seconds) values (p_kid, p_subject, p_seconds);
  update subjects set total_seconds = total_seconds + p_seconds where id=p_subject;
end $$;

create or replace function claim_study_reward(p_kid uuid, p_day date default current_date, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare secs int; goal int; pts int; existing int;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  select coalesce(sum(seconds),0) into secs from study_sessions where kid_id=p_kid and created_at::date=p_day;
  select study_goal_seconds, study_reward_points into goal, pts from settings where id=1;
  if secs < coalesce(goal,3600) then raise exception 'Aún no has llegado al objetivo de hoy'; end if;
  select count(*) into existing from study_rewards where kid_id=p_kid and day=p_day;
  if existing > 0 then raise exception 'Ya has reclamado la recompensa de hoy'; end if;
  insert into study_rewards(kid_id, day, seconds, points) values (p_kid, p_day, secs, coalesce(pts,20));
end $$;

create or replace function set_avatar(p_kid uuid, p_avatar text, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  update kids set avatar = p_avatar where id = p_kid;
end $$;

create or replace function finish_test(p_kid uuid, p_subject uuid, p_score int, p_total int, p_elapsed int, p_sigs text[], p_correct boolean[], p_pin text default null)
returns json language plpgsql security definer set search_path = public as $$
declare cnt int; secs int; susp boolean; i int;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  select count(*) into cnt from test_sessions where kid_id=p_kid and subject_id=p_subject and day=current_date;
  if cnt >= 3 then raise exception 'Has alcanzado el límite de 3 tests de esta asignatura por hoy'; end if;
  susp := (p_elapsed < greatest(1, coalesce(p_total,0)) * 3);
  secs := case when susp then 60 else 300 end;
  insert into study_sessions(kid_id, subject_id, seconds) values (p_kid, p_subject, secs);
  update subjects set total_seconds = total_seconds + secs where id=p_subject;
  insert into test_sessions(kid_id, subject_id, score, total, seconds_awarded, suspicious)
  values (p_kid, p_subject, coalesce(p_score,0), coalesce(p_total,0), secs, susp);
  if p_sigs is not null then
    for i in 1 .. array_length(p_sigs,1) loop
      insert into study_questions_seen(kid_id, subject_id, q_sig, correct)
      values (p_kid, p_subject, p_sigs[i], coalesce(p_correct[i], false)) on conflict (kid_id, q_sig) do nothing;
    end loop;
  end if;
  return json_build_object('awarded', secs, 'suspicious', susp, 'remaining', greatest(0, 3-(cnt+1)));
end $$;

create or replace function tutor_mark_done(p_tutor uuid, p_assignment uuid, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (is_admin() or ((kid_pin_ok(p_tutor,p_pin) or kid_owner_ok(p_tutor)) and exists (select 1 from kids where id=p_tutor and can_tutor)))
    then raise exception 'No autorizado'; end if;
  update assignments set status='pending', completed_at=now() where id=p_assignment and status in ('todo','rejected');
end $$;

create or replace function request_custom_reward(p_kid uuid, p_title text, p_cost int, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare k kids%rowtype;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  if coalesce(p_cost,0) < 0 then raise exception 'Coste no válido'; end if;
  select * into k from kids where id=p_kid;
  if k.total_points < coalesce(p_cost,0) then raise exception 'No tienes puntos suficientes'; end if;
  insert into redemptions(kid_id, reward_id, title, cost) values (p_kid, null, '⭐ ' || p_title, coalesce(p_cost,0));
end $$;

grant execute on function mark_done(uuid,uuid,text,text,text) to anon, authenticated;
grant execute on function request_redemption(uuid,uuid,text) to anon, authenticated;
grant execute on function request_gift(uuid,uuid,int,text,text) to anon, authenticated;
grant execute on function log_study(uuid,uuid,int,text) to anon, authenticated;
grant execute on function claim_study_reward(uuid,date,text) to anon, authenticated;
grant execute on function set_avatar(uuid,text,text) to anon, authenticated;
grant execute on function finish_test(uuid,uuid,int,int,int,text[],boolean[],text) to anon, authenticated;
grant execute on function tutor_mark_done(uuid,uuid,text) to anon, authenticated;
grant execute on function request_custom_reward(uuid,text,int,text) to anon, authenticated;

notify pgrst, 'reload schema';
