-- =====================================================================
-- GÁNATE EL VERANO — MOTOR DE TESTS INTELIGENTE
-- No repetir preguntas · Límite 3 tests/asignatura/día · Tope 5 min ·
-- El estudio real vale más · Detección de farmeo
-- Pega en Supabase > SQL Editor > RUN.
-- =====================================================================

-- Preguntas ya vistas por cada alumno (para no repetir jamás)
create table if not exists study_questions_seen (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid references kids(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  q_sig text not null,
  correct boolean not null default false,
  created_at timestamptz default now(),
  unique (kid_id, q_sig)
);

-- Registro de cada test (límite diario + anti-farmeo)
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
create policy "read_sqs" on study_questions_seen for select using (true);
create policy "read_ts" on test_sessions for select using (true);
create policy "w_ts_admin" on test_sessions for all using (is_admin()) with check (is_admin());

-- Finalizar un test: aplica reglas y devuelve resultado
create or replace function finish_test(
  p_kid uuid, p_pin text, p_subject uuid,
  p_score int, p_total int, p_elapsed int,
  p_sigs text[], p_correct boolean[]
) returns json language plpgsql security definer set search_path = public as $$
declare cnt int; secs int; susp boolean; i int;
begin
  if not (kid_pin_ok(p_kid, p_pin) or is_admin()) then raise exception 'No autorizado'; end if;

  -- REGLA 3: máximo 3 tests por asignatura y día
  select count(*) into cnt from test_sessions
   where kid_id = p_kid and subject_id = p_subject and day = current_date;
  if cnt >= 3 then raise exception 'Has alcanzado el límite de 3 tests de esta asignatura por hoy'; end if;

  -- REGLA 6: detección de farmeo (demasiado rápido: < 3s por pregunta)
  susp := (p_elapsed < greatest(1, coalesce(p_total, 0)) * 3);

  -- REGLA 4 + 5: el test aporta como MÁXIMO 5 min; si es sospechoso, recortado
  secs := case when susp then 60 else 300 end;

  insert into study_sessions(kid_id, subject_id, seconds) values (p_kid, p_subject, secs);
  update subjects set total_seconds = total_seconds + secs where id = p_subject;
  insert into test_sessions(kid_id, subject_id, score, total, seconds_awarded, suspicious)
  values (p_kid, p_subject, coalesce(p_score,0), coalesce(p_total,0), secs, susp);

  -- REGLA 1: registrar preguntas vistas (no se repetirán)
  if p_sigs is not null then
    for i in 1 .. array_length(p_sigs, 1) loop
      insert into study_questions_seen(kid_id, subject_id, q_sig, correct)
      values (p_kid, p_subject, p_sigs[i], coalesce(p_correct[i], false))
      on conflict (kid_id, q_sig) do nothing;
    end loop;
  end if;

  return json_build_object('awarded', secs, 'suspicious', susp, 'remaining', greatest(0, 3 - (cnt + 1)));
end $$;
grant execute on function finish_test(uuid,text,uuid,int,int,int,text[],boolean[]) to anon, authenticated;

notify pgrst, 'reload schema';
