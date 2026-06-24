-- =====================================================================
-- GÁNATE EL VERANO — CORRECCIONES
-- 1) Arregla "Could not find function mark_done(p_assignment, p_kid)"
--    (PIN opcional + una sola versión de la función)
-- 2) apply_points: otorgar recompensa / penalizar desde el panel de padres
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- Elimina TODAS las versiones antiguas de mark_done (evita ambigüedad)
do $$ declare r record; begin
  for r in select oid::regprocedure as sig from pg_proc
           where proname = 'mark_done' and pronamespace = 'public'::regnamespace loop
    execute 'drop function ' || r.sig || ' cascade';
  end loop;
end $$;

-- Versión única y canónica (PIN opcional: admite hijo con PIN o admin en modo test)
create or replace function mark_done(p_assignment uuid, p_kid uuid, p_pin text default null, p_note text default null, p_photo text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'PIN incorrecto'; end if;
  update assignments set status='pending', completed_at=now(),
         note = coalesce(p_note, note), photo_url = coalesce(p_photo, photo_url)
   where id = p_assignment and kid_id = p_kid and status in ('todo','rejected');
end $$;
grant execute on function mark_done(uuid,uuid,text,text,text) to anon, authenticated;

-- Ajuste manual de puntos: + recompensa / - penalización (solo padres)
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

-- Refresca la caché de la API
notify pgrst, 'reload schema';
