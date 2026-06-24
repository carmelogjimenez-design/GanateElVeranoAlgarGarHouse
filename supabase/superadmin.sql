-- =====================================================================
-- SUPERADMIN + MODO TEST
-- carmelogjimenez@gmail.com puede entrar a AMBOS paneles (padres e hijos)
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- 1) is_admin() reconoce 'admin' y 'superadmin'
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'));
$$;

create or replace function is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'superadmin');
$$;
grant execute on function is_superadmin() to anon, authenticated;

-- 2) Tu email = superadmin (crea/actualiza el perfil)
insert into profiles(id, name, role)
select id, coalesce(raw_user_meta_data->>'name', 'Carmelo'), 'superadmin'
from auth.users where email = 'carmelogjimenez@gmail.com'
on conflict (id) do update set role = 'superadmin';

-- 3) Las RPC de hijo aceptan PIN correcto O un admin (para testar sin PIN)
create or replace function mark_done(p_assignment uuid, p_kid uuid, p_pin text, p_note text default null, p_photo text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'PIN incorrecto'; end if;
  update assignments set status='pending', completed_at=now(),
         note=coalesce(p_note, note), photo_url=coalesce(p_photo, photo_url)
   where id=p_assignment and kid_id=p_kid and status in ('todo','rejected');
end $$;

create or replace function request_redemption(p_kid uuid, p_pin text, p_reward uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r rewards%rowtype; k kids%rowtype;
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'PIN incorrecto'; end if;
  select * into r from rewards where id=p_reward and active;
  select * into k from kids where id=p_kid;
  if r.id is null then raise exception 'Recompensa no disponible'; end if;
  if k.total_points < r.cost then raise exception 'No tienes puntos suficientes'; end if;
  insert into redemptions(kid_id, reward_id, title, cost) values (p_kid, r.id, r.title, r.cost);
end $$;

create or replace function request_gift(p_from uuid, p_pin text, p_to uuid, p_points int, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
declare k kids%rowtype;
begin
  if not (kid_pin_ok(p_from, p_pin) or is_admin()) then raise exception 'PIN incorrecto'; end if;
  if p_points <= 0 then raise exception 'Puntos no válidos'; end if;
  if p_from = p_to then raise exception 'No puedes regalarte a ti mismo'; end if;
  select * into k from kids where id=p_from;
  if k.total_points < p_points then raise exception 'No tienes puntos suficientes'; end if;
  insert into gifts(from_kid, to_kid, points, reason) values (p_from, p_to, p_points, p_reason);
end $$;

create or replace function log_study(p_kid uuid, p_pin text, p_subject uuid, p_seconds int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'PIN incorrecto'; end if;
  if p_seconds <= 0 then return; end if;
  insert into study_sessions(kid_id, subject_id, seconds) values (p_kid, p_subject, p_seconds);
  update subjects set total_seconds = total_seconds + p_seconds where id=p_subject;
end $$;

create or replace function tutor_mark_done(p_tutor uuid, p_pin text, p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (is_admin() or (kid_pin_ok(p_tutor, p_pin) and exists (select 1 from kids where id = p_tutor and can_tutor)))
    then raise exception 'No autorizado'; end if;
  update assignments set status='pending', completed_at=now()
   where id=p_assignment and status in ('todo','rejected');
end $$;
