-- =====================================================================
-- DIAGNÓSTICO · Flujo de VALIDAR  (solo lectura — no modifica nada)
-- Pega TODO en Supabase > SQL Editor > RUN y mándame los resultados.
-- =====================================================================

-- 1) ¿Existen las funciones que usa la pantalla de Validar?
with esperadas(fn) as (values
  ('approve_assignment'),('reject_assignment'),
  ('approve_redemption'),('reject_redemption'),
  ('approve_gift'),('reject_gift'),
  ('approve_study_reward'),('reject_study_reward'),('approve_kid'))
select e.fn as funcion,
       case when bool_or(p.proname is not null) then '✅ existe' else '❌ FALTA' end as estado
from esperadas e
left join pg_proc p
  on p.proname = e.fn and p.pronamespace = 'public'::regnamespace
group by e.fn
order by estado, funcion;

-- 1b) ¿La función approve_assignment aplica el Doble XP (multiplicador)?
select coalesce(bool_or(pg_get_functiondef(oid) ilike '%active_multiplier%'), false) as aplica_doble_xp
from pg_proc
where proname = 'approve_assignment' and pronamespace = 'public'::regnamespace;

-- 2) ¿Hay algún trigger en point_events que mantenga total_points?
select tgname as trigger, tgrelid::regclass as tabla
from pg_trigger
where tgrelid = 'point_events'::regclass and not tgisinternal;

-- 3) ¿Cuadra total_points con la suma real de point_events?
--    0 filas = todo cuadra (validar suma bien). Si salen filas = hay descuadre.
select k.name, k.total_points,
       coalesce(sum(pe.delta),0) as suma_eventos,
       k.total_points - coalesce(sum(pe.delta),0) as descuadre
from kids k
left join point_events pe on pe.kid_id = k.id
group by k.id, k.name, k.total_points
having k.total_points - coalesce(sum(pe.delta),0) <> 0
order by descuadre;

-- 4) Estructura de las tablas implicadas (por si hay que recrear funciones)
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('redemptions','gifts','point_events')
order by table_name, ordinal_position;
