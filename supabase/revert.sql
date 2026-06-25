-- =====================================================================
-- ANULAR misión validada (cuando un hijo mintió)  ·  solo admin
-- Deshace EXACTAMENTE los puntos otorgados por esa misión (individual
-- o de equipo, con multiplicador incluido), permite penalización extra
-- y la deja en estado 'rechazada'. Re-ejecutable (no resta dos veces).
-- =====================================================================
create or replace function revert_assignment(p_assignment uuid, p_penalty int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare a assignments%rowtype; r record;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id = p_assignment;
  if a.id is null then return; end if;

  -- 1) Deshacer los puntos ya otorgados por esta misión (a quien los recibió)
  for r in
    select kid_id, sum(delta) as d
    from point_events
    where ref_id = a.id and type = 'task'
    group by kid_id
  loop
    if r.d <> 0 then
      insert into point_events(kid_id, delta, reason, type, ref_id)
      values (r.kid_id, -r.d, 'Anulada: ' || a.title, 'task', a.id);
    end if;
  end loop;

  -- 2) Penalización extra opcional (al dueño de la misión)
  if p_penalty > 0 and a.kid_id is not null then
    insert into point_events(kid_id, delta, reason, type)
    values (a.kid_id, -abs(p_penalty), 'Penalización: ' || a.title, 'task');
  end if;

  -- 3) Marcar como rechazada (todo el grupo si era grupal)
  if a.grupal and a.group_id is not null then
    update assignments set status = 'rejected' where group_id = a.group_id;
  else
    update assignments set status = 'rejected' where id = p_assignment;
  end if;
end $$;

grant execute on function revert_assignment(uuid, int) to authenticated;
notify pgrst, 'reload schema';
