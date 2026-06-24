-- =====================================================================
-- FIX: "Could not choose the best candidate function ... apply_points"
-- Elimina las versiones duplicadas y deja una sola.
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================
do $$ declare r record; begin
  for r in select oid::regprocedure as sig from pg_proc
           where proname = 'apply_points' and pronamespace = 'public'::regnamespace loop
    execute 'drop function ' || r.sig || ' cascade';
  end loop;
end $$;

create or replace function apply_points(p_kid uuid, p_delta int, p_reason text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  if p_delta = 0 then return; end if;
  insert into point_events(kid_id, delta, reason, type)
  values (p_kid, p_delta, coalesce(nullif(p_reason, ''), case when p_delta > 0 then 'Recompensa' else 'Penalización' end), 'task');
  if p_delta > 0 then perform award_badges(p_kid); end if;
end $$;
grant execute on function apply_points(uuid,int,text) to authenticated;

notify pgrst, 'reload schema';
