-- =====================================================================
-- ALTA AUTOMÁTICA: cualquiera que se registre se crea como HIJO PENDIENTE
-- y aparece en Validar para asignarle equipo. Incluye backfill de los ya
-- registrados (Carmen, Leyre, ...). Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- 1) Función + trigger: al crearse un usuario de Auth, se le crea ficha de hijo
create or replace function handle_new_user_kid()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from kids where user_id = new.id) then
    insert into kids(name, user_id, status, color, app_access)
    values (
      coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
      new.id, 'pending',
      (array['#FF8A00','#3B82F6','#19D3AE','#A855F7','#EC4899','#EAB308','#06B6D4','#EF4444','#22C55E'])[1 + (abs(hashtext(new.id::text)) % 9)],
      true
    );
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_kid on auth.users;
create trigger on_auth_user_created_kid
  after insert on auth.users
  for each row execute function handle_new_user_kid();

-- 2) Backfill: crea ficha de hijo a los ya registrados que no la tengan
--    (excepto los que ya son admin/superadmin)
insert into kids(name, user_id, status, color, app_access)
select
  coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
  u.id, 'pending',
  (array['#FF8A00','#3B82F6','#19D3AE','#A855F7','#EC4899','#EAB308','#06B6D4','#EF4444','#22C55E'])[1 + (abs(hashtext(u.id::text)) % 9)],
  true
from auth.users u
left join profiles p on p.id = u.id
where not exists (select 1 from kids k where k.user_id = u.id)
  and coalesce(p.role, 'member') not in ('admin', 'superadmin');

-- 3) Que la lista de "Administradores" NO muestre a los hijos (solo admins
--    y cuentas sin ficha de hijo), para no mezclar conceptos
create or replace function list_accounts()
returns table(id uuid, email text, name text, role text)
language sql security definer set search_path = public as $$
  select u.id, u.email::text, coalesce(p.name, u.email::text), coalesce(p.role, 'member')
  from auth.users u
  left join profiles p on p.id = u.id
  where is_superadmin()
    and (coalesce(p.role, 'member') in ('admin', 'superadmin')
         or not exists (select 1 from kids k where k.user_id = u.id))
  order by u.created_at;
$$;
grant execute on function list_accounts() to authenticated;

notify pgrst, 'reload schema';
