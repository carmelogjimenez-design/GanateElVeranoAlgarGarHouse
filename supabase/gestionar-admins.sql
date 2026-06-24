-- =====================================================================
-- CHULETA — Gestionar administradores (ejecuta en SQL Editor cuando quieras)
-- =====================================================================

-- A) Ver quién se ha registrado y su rol:
select u.email, p.name, p.role, u.created_at
from auth.users u
join profiles p on p.id = u.id
order by u.created_at desc;

-- B) Hacer ADMIN a alguien (pon su email):
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'tamar@ejemplo.com');

-- C) Quitarle admin (volver a usuario normal):
update profiles set role = 'member'
where id = (select id from auth.users where email = 'alguien@ejemplo.com');
