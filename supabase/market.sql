-- ============================================================
-- EL MERCADO · tablón de tratos entre hermanos
-- 'offer'   = "Hago un favor por X XP"  (lo paga quien lo acepta)
-- 'request' = "Pago X XP por un favor"  (lo paga quien lo publica)
-- Quien HACE el favor gana los puntos; quien lo RECIBE paga. Los
-- padres validan el trato cerrado. Requiere notifications (steal.sql).
-- Seguro re-ejecutar.
-- ============================================================

create table if not exists market_offers (
  id uuid primary key default gen_random_uuid(),
  maker_id uuid references kids(id) on delete cascade,
  taker_id uuid references kids(id) on delete set null,
  kind text not null,                       -- 'offer' | 'request'
  title text not null,
  points int not null default 1,
  status text not null default 'open',      -- open | taken | done | rejected | cancelled
  created_at timestamptz default now(),
  closed_at timestamptz
);
alter table market_offers enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='market_offers' and policyname='read_market')
    then create policy "read_market" on market_offers for select using (true); end if;
end $$;

-- Publicar trato
create or replace function create_offer(p_maker uuid, p_pin text, p_kind text, p_title text, p_points int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_act(p_maker, p_pin) then raise exception 'No autorizado'; end if;
  if p_kind not in ('offer', 'request') then raise exception 'Tipo no válido'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Ponle un título al trato'; end if;
  if p_points < 1 then raise exception 'Pon al menos 1 XP'; end if;
  if p_kind = 'request' and (select total_points from kids where id = p_maker) < p_points then
    raise exception 'No tienes suficiente XP para pagar ese trato';
  end if;
  insert into market_offers(maker_id, kind, title, points, status) values (p_maker, p_kind, p_title, p_points, 'open');
end $$;
grant execute on function create_offer(uuid, text, text, text, int) to anon, authenticated;

-- Aceptar trato
create or replace function accept_offer(p_offer uuid, p_taker uuid, p_pin text)
returns void language plpgsql security definer set search_path = public as $$
declare o market_offers%rowtype; v_payer uuid; v_name text;
begin
  if not can_act(p_taker, p_pin) then raise exception 'No autorizado'; end if;
  select * into o from market_offers where id = p_offer for update;
  if o.id is null or o.status <> 'open' then raise exception 'Ese trato ya no está disponible'; end if;
  if o.maker_id = p_taker then raise exception 'No puedes aceptar tu propio trato'; end if;
  v_payer := case when o.kind = 'offer' then p_taker else o.maker_id end;
  if (select total_points from kids where id = v_payer) < o.points then
    raise exception 'No hay suficiente XP para cerrar el trato';
  end if;
  update market_offers set taker_id = p_taker, status = 'taken' where id = p_offer;
  select name into v_name from kids where id = p_taker;
  insert into notifications(kid_id, type, title, body)
  values (o.maker_id, 'market', 'Han aceptado tu trato', v_name || ' ha aceptado «' || o.title || '». Falta el OK de los jefes.');
end $$;
grant execute on function accept_offer(uuid, uuid, text) to anon, authenticated;

-- Cancelar (solo el dueño, si sigue abierto)
create or replace function cancel_offer(p_offer uuid, p_maker uuid, p_pin text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_act(p_maker, p_pin) then raise exception 'No autorizado'; end if;
  update market_offers set status = 'cancelled', closed_at = now()
   where id = p_offer and maker_id = p_maker and status = 'open';
end $$;
grant execute on function cancel_offer(uuid, uuid, text) to anon, authenticated;

-- Validar trato cerrado (padres): mueve los puntos
create or replace function approve_market(p_offer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o market_offers%rowtype; v_payer uuid; v_doer uuid;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into o from market_offers where id = p_offer for update;
  if o.id is null or o.status <> 'taken' then return; end if;
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

-- Rechazar trato cerrado (padres): vuelve a quedar abierto
create or replace function reject_market(p_offer uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  update market_offers set status = 'open', taker_id = null where id = p_offer and status = 'taken';
end $$;
grant execute on function reject_market(uuid) to authenticated;

notify pgrst, 'reload schema';
