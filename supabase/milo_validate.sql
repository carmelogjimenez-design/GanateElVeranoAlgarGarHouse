-- =====================================================================
-- MILO · ahora SIEMPRE lo validan los padres
-- finish_milo deja el paseo en 'pending'; los padres lo aprueban/rechazan
-- y solo entonces se suman los puntos. Re-ejecutable.
-- =====================================================================

-- 1) Ampliar los estados permitidos
alter table milo_walks drop constraint if exists milo_walks_status_check;
alter table milo_walks add constraint milo_walks_status_check
  check (status in ('in_progress','pending','approved','rejected','done'));

-- 2) Terminar el paseo -> queda PENDIENTE (no suma todavía)
create or replace function finish_milo(p_walk uuid, p_photo text, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare w milo_walks%rowtype; mins int; pts int;
begin
  select * into w from milo_walks where id = p_walk;
  if w.id is null or w.status <> 'in_progress' then return; end if;
  if not can_act(w.kid_id, p_pin) then raise exception 'No autorizado'; end if;
  mins := greatest(0, round(extract(epoch from (now() - w.started_at)) / 60)::int);
  pts  := milo_points(mins);
  update milo_walks set ended_at = now(), end_photo = p_photo, minutes = mins, points = pts, status = 'pending' where id = p_walk;
end $$;

-- 3) Validar (padres) -> suma los puntos
create or replace function approve_milo(p_walk uuid)
returns void language plpgsql security definer set search_path = public as $$
declare w milo_walks%rowtype;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into w from milo_walks where id = p_walk for update;
  if w.id is null or w.status <> 'pending' then return; end if;
  update milo_walks set status = 'approved' where id = p_walk;
  if coalesce(w.points, 0) > 0 then
    insert into point_events(kid_id, delta, reason, type, ref_id)
      values (w.kid_id, w.points, 'Paseo con Milo (' || coalesce(w.minutes, 0) || ' min)', 'task', w.id);
    perform award_badges(w.kid_id);
  end if;
end $$;

-- 4) Rechazar (padres) -> sin puntos
create or replace function reject_milo(p_walk uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  update milo_walks set status = 'rejected' where id = p_walk and status = 'pending';
end $$;

grant execute on function approve_milo(uuid) to authenticated;
grant execute on function reject_milo(uuid)  to authenticated;
notify pgrst, 'reload schema';
