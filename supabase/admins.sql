-- =====================================================================
-- GESTIÓN DE ADMINISTRADORES (solo superadmin)
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- 1) INMEDIATO: hacer admin a Tamar y Ricardo
insert into profiles(id, name, role)
select id, coalesce(raw_user_meta_data->>'name', email), 'admin'
from auth.users where email in ('sqeids@gmail.com', 'tamargarci@gmail.com')
on conflict (id) do update set role = 'admin';

-- Si al registrarse se les creó una "ficha de hijo", se elimina (son padres, no jugadores)
delete from kids where user_id in (select id from auth.users where email in ('sqeids@gmail.com', 'tamargarci@gmail.com'));

-- 2) Funciones para gestionarlo desde el panel de superadmin
create or replace function list_accounts()
returns table(id uuid, email text, name text, role text)
language sql security definer set search_path = public as $$
  select u.id, u.email::text, coalesce(p.name, u.email::text), coalesce(p.role, 'member')
  from auth.users u left join profiles p on p.id = u.id
  where is_superadmin()
  order by u.created_at;
$$;
grant execute on function list_accounts() to authenticated;

create or replace function set_account_role(p_email text, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not is_superadmin() then raise exception 'Solo el superadmin puede cambiar roles'; end if;
  if p_role not in ('member', 'admin') then raise exception 'Rol no válido'; end if;
  select id into uid from auth.users where email = p_email;
  if uid is null then raise exception 'No existe esa cuenta'; end if;
  insert into profiles(id, role) values (uid, p_role) on conflict (id) do update set role = p_role;
  if p_role = 'admin' then delete from kids where user_id = uid; end if;
end $$;
grant execute on function set_account_role(text,text) to authenticated;

notify pgrst, 'reload schema';
