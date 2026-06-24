-- =====================================================================
-- GÁNATE EL VERANO — EVENTOS (Doble XP / retos sorpresa)
-- =====================================================================
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'double_xp',
  multiplier numeric not null default 2,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table events enable row level security;
create policy "read_events" on events for select using (true);
create policy "w_events" on events for all using (is_admin()) with check (is_admin());

create or replace function active_multiplier()
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(max(multiplier), 1) from events
   where kind = 'double_xp' and active and now() between starts_at and ends_at;
$$;
grant execute on function active_multiplier() to anon, authenticated;

create or replace function approve_assignment(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype; m record; mult numeric; pts int; tag text;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id = p_assignment for update;
  if a.id is null or a.status = 'approved' then return; end if;
  mult := active_multiplier(); pts := round(a.points * mult);
  tag := case when mult > 1 then ' (x' || mult || ')' else '' end;
  if a.grupal and a.team_id is not null then
    update assignments set status='approved', validated_at=now() where group_id = a.group_id;
    for m in select id from kids where team_id = a.team_id and active loop
      insert into point_events(kid_id, delta, reason, type, ref_id) values (m.id, pts, 'Misión de equipo: ' || a.title || tag, 'task', a.id);
      perform award_badges(m.id);
    end loop;
  else
    update assignments set status='approved', validated_at=now() where id = p_assignment;
    insert into point_events(kid_id, delta, reason, type, ref_id) values (a.kid_id, pts, 'Misión: ' || a.title || tag, 'task', a.id);
    perform award_badges(a.kid_id);
  end if;
end $$;

create or replace function admin_complete(p_assignment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype; mult numeric; pts int;
begin
  if not is_admin() then raise exception 'No autorizado'; end if;
  select * into a from assignments where id = p_assignment for update;
  if a.id is null or a.status = 'approved' then return; end if;
  mult := active_multiplier(); pts := round(a.points * mult);
  update assignments set status='approved', completed_at=now(), validated_at=now() where id = p_assignment;
  insert into point_events(kid_id, delta, reason, type, ref_id) values (a.kid_id, pts, 'Misión (por padre): ' || a.title, 'task', a.id);
  perform award_badges(a.kid_id);
end $$;

notify pgrst, 'reload schema';
