-- =====================================================================
-- INTEGRIDAD DE PUNTOS  (seguro de ejecutar, no duplica puntos)
-- Garantiza que kids.total_points = suma de point_events SIEMPRE.
-- Como RECALCULA (valor absoluto), nunca duplica aunque ya exista
-- otro mecanismo, y deja el botón de Reset perfecto.
-- =====================================================================
create or replace function sync_kid_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_kid uuid := coalesce(new.kid_id, old.kid_id);
begin
  update kids
     set total_points = (select coalesce(sum(delta),0) from point_events where kid_id = v_kid)
   where id = v_kid;
  return null;
end $$;

drop trigger if exists trg_sync_kid_points on point_events;
create trigger trg_sync_kid_points
  after insert or update or delete on point_events
  for each row execute function sync_kid_points();

-- Corrige cualquier descuadre actual de una vez:
update kids set total_points = (
  select coalesce(sum(delta),0) from point_events where kid_id = kids.id
);

notify pgrst, 'reload schema';
