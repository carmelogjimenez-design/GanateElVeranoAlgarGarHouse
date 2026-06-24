-- =====================================================================
-- GÁNATE EL VERANO — Registro abierto + admins manuales
-- Pega TODO esto en Supabase > SQL Editor > RUN (una sola vez).
-- =====================================================================

-- 1) Quien se registra entra como 'member' (NO admin) por defecto.
alter table profiles alter column role set default 'member';

-- 2) is_admin() solo es cierto si el rol es exactamente 'admin'.
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- 3) Cada nuevo registro crea su perfil como 'member'.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Usuario'), 'member')
  on conflict (id) do nothing;
  return new;
end $$;

-- 4) (OPCIONAL) Si algún usuario quedó como admin por el sistema antiguo
--    y quieres dejarlos a todos en 'member' para empezar de cero, descomenta:
-- update profiles set role = 'member';
