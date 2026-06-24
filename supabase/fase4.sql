-- =====================================================================
-- GÁNATE EL VERANO — FASE 4 (Padres pro)
-- Suscripciones para notificaciones push de los padres
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='own_sub_select')
    then create policy "own_sub_select" on push_subscriptions for select using (auth.uid() = user_id); end if;
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='own_sub_insert')
    then create policy "own_sub_insert" on push_subscriptions for insert with check (auth.uid() = user_id); end if;
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='own_sub_delete')
    then create policy "own_sub_delete" on push_subscriptions for delete using (auth.uid() = user_id); end if;
end $$;
