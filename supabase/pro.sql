-- =====================================================================
-- GÁNATE EL VERANO — PRO (mercado, equipos, fotos, recompensas)
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- 1) FIX mercado: request_gift con PIN opcional (una sola versión)
do $$ declare r record; begin
  for r in select oid::regprocedure as sig from pg_proc where proname='request_gift' and pronamespace='public'::regnamespace loop
    execute 'drop function ' || r.sig || ' cascade';
  end loop;
end $$;
create or replace function request_gift(p_from uuid, p_to uuid, p_points int, p_reason text default '', p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare k kids%rowtype;
begin
  if not (kid_pin_ok(p_from, p_pin) or is_admin()) then raise exception 'PIN incorrecto'; end if;
  if p_points <= 0 then raise exception 'Puntos no válidos'; end if;
  if p_from = p_to then raise exception 'No puedes regalarte a ti mismo'; end if;
  select * into k from kids where id = p_from;
  if k.total_points < p_points then raise exception 'No tienes puntos suficientes'; end if;
  insert into gifts(from_kid, to_kid, points, reason) values (p_from, p_to, p_points, p_reason);
end $$;
grant execute on function request_gift(uuid,uuid,int,text,text) to anon, authenticated;

-- 2) Misiones de equipo (grupales): suman a todos los miembros del equipo
alter table assignments add column if not exists group_id uuid;
alter table assignments add column if not exists grupal boolean not null default false;

create or replace function approve_assignment(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype; m record;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id = p_assignment for update;
  if a.id is null or a.status = 'approved' then return; end if;
  if a.grupal and a.team_id is not null then
    update assignments set status='approved', validated_at=now() where group_id = a.group_id;
    for m in select id from kids where team_id = a.team_id and active loop
      insert into point_events(kid_id, delta, reason, type, ref_id) values (m.id, a.points, 'Misión de equipo: ' || a.title, 'task', a.id);
      perform award_badges(m.id);
    end loop;
  else
    update assignments set status='approved', validated_at=now() where id = p_assignment;
    insert into point_events(kid_id, delta, reason, type, ref_id) values (a.kid_id, a.points, 'Misión: ' || a.title, 'task', a.id);
    perform award_badges(a.kid_id);
  end if;
end $$;

-- 3) Storage para avatares/fotos de perfil
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='av_read')
    then create policy "av_read" on storage.objects for select using (bucket_id='avatars'); end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='av_insert')
    then create policy "av_insert" on storage.objects for insert with check (bucket_id='avatars'); end if;
end $$;

-- 4) Foto de perfil de los padres
alter table profiles add column if not exists avatar_url text;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='update_own_profile')
    then create policy "update_own_profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id); end if;
end $$;

-- 5) Recompensa personalizada pedida por el hijo (la validan los padres)
create or replace function request_custom_reward(p_kid uuid, p_title text, p_cost int, p_pin text default null)
returns void language plpgsql security definer set search_path = public as $$
declare k kids%rowtype;
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'No autorizado'; end if;
  if coalesce(p_cost,0) < 0 then raise exception 'Coste no válido'; end if;
  select * into k from kids where id = p_kid;
  if k.total_points < coalesce(p_cost,0) then raise exception 'No tienes puntos suficientes'; end if;
  insert into redemptions(kid_id, reward_id, title, cost) values (p_kid, null, '⭐ ' || p_title, coalesce(p_cost,0));
end $$;
grant execute on function request_custom_reward(uuid,text,int,text) to anon, authenticated;

notify pgrst, 'reload schema';
