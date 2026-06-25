-- =====================================================================
-- HORA TOPE POR TAREA · si no se hace a tiempo, resta los puntos
-- Usa la hora oficial de España (Europe/Madrid). Re-ejecutable.
-- =====================================================================
alter table tasks       add column if not exists deadline_time time;          -- hora límite (NULL = sin límite)
alter table assignments add column if not exists expired boolean not null default false;

-- Penaliza las misiones individuales vencidas (que el hijo NO envió a tiempo).
-- Devuelve cuántas ha caducado en esta pasada.
create or replace function expire_overdue()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare a record; n int := 0;
begin
  for a in
    select asg.id, asg.kid_id, asg.points, asg.title
    from assignments asg
    join tasks t on t.id = asg.task_id
    where asg.status in ('todo','rejected')
      and not asg.expired
      and asg.kid_id is not null
      and asg.due_date is not null
      and t.deadline_time is not null
      and now() > ((asg.due_date::timestamp + t.deadline_time) at time zone 'Europe/Madrid')
  loop
    insert into point_events(kid_id, delta, reason, type, ref_id)
      values (a.kid_id, -a.points, 'Fuera de tiempo: ' || a.title, 'task', a.id);
    update assignments set expired = true where id = a.id;
    n := n + 1;
  end loop;
  return n;
end $$;

grant execute on function expire_overdue() to anon, authenticated;
notify pgrst, 'reload schema';
