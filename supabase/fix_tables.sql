-- =====================================================================
-- FIX: relation "test_sessions" does not exist
-- Crea las tablas del motor de tests si faltan (seguro re-ejecutar).
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================
create table if not exists study_questions_seen (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  q_sig text not null,
  correct boolean not null default false,
  created_at timestamptz default now(),
  unique (kid_id, q_sig)
);

create table if not exists test_sessions (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  day date not null default current_date,
  score int not null default 0,
  total int not null default 0,
  seconds_awarded int not null default 0,
  suspicious boolean not null default false,
  created_at timestamptz default now()
);

alter table study_questions_seen enable row level security;
alter table test_sessions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_questions_seen' and policyname='read_sqs')
    then create policy "read_sqs" on study_questions_seen for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='test_sessions' and policyname='read_ts')
    then create policy "read_ts" on test_sessions for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename='test_sessions' and policyname='w_ts_admin')
    then create policy "w_ts_admin" on test_sessions for all using (is_admin()) with check (is_admin()); end if;
end $$;

notify pgrst, 'reload schema';
