-- =====================================================================
-- MURO DE ACTIVIDAD: reacciones (🔥 👏 😂 💪) de hermanos y padres
-- Pega en Supabase > SQL Editor > RUN.  (Seguro re-ejecutar)
-- =====================================================================
create table if not exists activity_reactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  emoji text not null,
  author text not null,
  created_at timestamptz default now(),
  unique (event_id, emoji, author)
);
alter table activity_reactions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='activity_reactions' and policyname='read_ar')
    then create policy "read_ar" on activity_reactions for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='activity_reactions' and policyname='ins_ar')
    then create policy "ins_ar" on activity_reactions for insert with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='activity_reactions' and policyname='del_ar')
    then create policy "del_ar" on activity_reactions for delete using (true); end if;
end $$;
notify pgrst, 'reload schema';
