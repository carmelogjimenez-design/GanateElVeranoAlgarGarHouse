-- =====================================================================
-- RESET TOTAL · puntos e historial + misiones  (solo admin)
-- Pone a cero total_points de todos los hijos, borra el historial de
-- puntos (point_events) y todas las misiones (assignments), y vuelve a
-- generar las misiones de hoy (vacías). Idempotente y re-ejecutable.
-- =====================================================================
create or replace function admin_reset_all()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  delete from point_events;
  delete from assignments;
  update kids set total_points = 0;
  perform generate_missions(current_date);
end;
$$;

revoke all on function admin_reset_all() from public, anon;
grant execute on function admin_reset_all() to authenticated;
