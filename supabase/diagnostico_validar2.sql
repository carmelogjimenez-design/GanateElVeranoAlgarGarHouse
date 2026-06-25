-- =====================================================================
-- DIAGNÓSTICO VALIDAR (todo en UNA tabla) · solo lectura
-- Pega entero, RUN, y mándame la captura del resultado.
-- =====================================================================
with funcs(fn) as (values
  ('approve_assignment'),('reject_assignment'),
  ('approve_redemption'),('reject_redemption'),
  ('approve_gift'),('reject_gift'),
  ('approve_study_reward'),('reject_study_reward'),('approve_kid'))
select '1·Funciones' as bloque, f.fn as detalle,
       case when exists(select 1 from pg_proc p where p.proname=f.fn and p.pronamespace='public'::regnamespace)
            then '✅ existe' else '❌ FALTA' end as valor
from funcs f
union all
select '2·Doble XP', 'approve_assignment usa multiplicador',
       coalesce((select case when bool_or(pg_get_functiondef(oid) ilike '%active_multiplier%') then '✅ sí' else '⚠️ NO' end
                 from pg_proc where proname='approve_assignment' and pronamespace='public'::regnamespace), '❌ no existe')
union all
select '3·Trigger puntos', 'triggers en point_events',
       coalesce((select string_agg(tgname,', ') from pg_trigger where tgrelid='point_events'::regclass and not tgisinternal), '(ninguno)')
union all
select '4·Descuadre', 'hijos con total_points != suma',
       (select count(*)::text from (
          select k.id from kids k left join point_events pe on pe.kid_id=k.id
          group by k.id, k.total_points
          having k.total_points - coalesce(sum(pe.delta),0) <> 0) x)
union all
select '5·Columnas', c.table_name,
       string_agg(c.column_name, ', ' order by c.ordinal_position)
from information_schema.columns c
where c.table_name in ('redemptions','point_events')
group by c.table_name
order by bloque, detalle;
