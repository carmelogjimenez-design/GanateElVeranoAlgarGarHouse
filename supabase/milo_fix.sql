-- =====================================================================
-- MILO · arreglo de paseo atascado
--  (1) finish_milo lo puede cerrar CUALQUIER crío (no solo quien lo empezó)
--  (2) cancel_milo: abortar un paseo en marcha (sin puntos) para destrabar
--  (3) nuevo estado 'cancelled'
-- Re-ejecutable.
-- =====================================================================

-- Estados permitidos (añade 'cancelled')
alter table milo_walks drop constraint if exists milo_walks_status_check;
alter table milo_walks add constraint milo_walks_status_check
  check (status in ('in_progress','pending','approved','rejected','done','cancelled'));

-- Quitamos la versión antigua (3 args) para evitar ambigüedad de overload
drop function if exists finish_milo(uuid, text, text);

-- Terminar el paseo -> queda PENDIENTE (lo validan los padres).
-- p_actor = crío que pulsa "He vuelto". Si viene, validamos que sea un crío
-- con PIN válido; pero NO exigimos que sea quien lo empezó ("la hace cualquiera").
create or replace function finish_milo(p_walk uuid, p_photo text, p_pin text default null, p_actor uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare w milo_walks%rowtype; mins int; pts int;
begin
  select * into w from milo_walks where id = p_walk;
  if w.id is null or w.status <> 'in_progress' then return; end if;
  if p_actor is not null and not can_act(p_actor, p_pin) then raise exception 'No autorizado'; end if;
  mins := greatest(0, round(extract(epoch from (now() - w.started_at)) / 60)::int);
  pts  := milo_points(mins);
  update milo_walks set ended_at = now(), end_photo = p_photo, minutes = mins, points = pts, status = 'pending' where id = p_walk;
end $$;

-- Cancelar/quitar un paseo en marcha (sin puntos) -> destraba la tarjeta
create or replace function cancel_milo(p_walk uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update milo_walks set status = 'cancelled', ended_at = now()
   where id = p_walk and status = 'in_progress';
end $$;

grant execute on function finish_milo(uuid, text, text, uuid) to anon, authenticated;
grant execute on function cancel_milo(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
