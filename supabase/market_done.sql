-- ============================================================
-- MERCADO · paso "Hecho" del que hace el favor
-- Flujo: open -> taken (aceptado) -> submitted (el que hace marca
-- 'Hecho') -> done (los padres validan y mueven puntos).
-- Requiere market.sql. Seguro re-ejecutar.
-- ============================================================

-- El que hace el favor lo marca como hecho (taken -> submitted)
create or replace function market_done(p_offer uuid, p_kid uuid, p_pin text)
returns void language plpgsql security definer set search_path = public as $$
declare o market_offers%rowtype; v_doer uuid; v_other uuid; v_name text;
begin
  if not can_act(p_kid, p_pin) then raise exception 'No autorizado'; end if;
  select * into o from market_offers where id = p_offer for update;
  if o.id is null or o.status <> 'taken' then raise exception 'Ese trato no está activo'; end if;
  v_doer := case when o.kind = 'offer' then o.maker_id else o.taker_id end;
  if v_doer <> p_kid then raise exception 'Este favor no te toca a ti'; end if;
  v_other := case when o.kind = 'offer' then o.taker_id else o.maker_id end;
  update market_offers set status = 'submitted' where id = p_offer;
  select name into v_name from kids where id = p_kid;
  insert into notifications(kid_id, type, title, body)
  values (v_other, 'market', 'Favor hecho · falta validar', v_name || ' ha marcado «' || o.title || '» como hecho. Lo validan los jefes.');
end $$;
grant execute on function market_done(uuid, uuid, text) to anon, authenticated;

-- Validar (padres): ahora actúa sobre 'submitted'
create or replace function approve_market(p_offer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o market_offers%rowtype; v_payer uuid; v_doer uuid;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into o from market_offers where id = p_offer for update;
  if o.id is null or o.status <> 'submitted' then return; end if;
  if o.kind = 'offer' then v_doer := o.maker_id; v_payer := o.taker_id;
  else v_doer := o.taker_id; v_payer := o.maker_id; end if;
  if (select total_points from kids where id = v_payer) < o.points then
    raise exception 'El que paga no tiene suficiente XP';
  end if;
  insert into point_events(kid_id, delta, reason, type, ref_id) values
    (v_payer, -o.points, 'Mercado: ' || o.title, 'market', o.id),
    (v_doer,   o.points, 'Mercado: ' || o.title, 'market', o.id);
  update market_offers set status = 'done', closed_at = now() where id = p_offer;
  insert into notifications(kid_id, type, title, body) values
    (o.maker_id, 'market', 'Trato cerrado ✅', '«' || o.title || '» se ha completado.'),
    (o.taker_id, 'market', 'Trato cerrado ✅', '«' || o.title || '» se ha completado.');
end $$;
grant execute on function approve_market(uuid) to authenticated;

-- Rechazar (padres): vuelve al que hace el favor para repetirlo (submitted -> taken)
create or replace function reject_market(p_offer uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  update market_offers set status = 'taken' where id = p_offer and status = 'submitted';
end $$;
grant execute on function reject_market(uuid) to authenticated;

notify pgrst, 'reload schema';
