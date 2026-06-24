"use client";
import { useState, useEffect, useRef } from "react";
import { Card, Btn, Chip, Bar, Modal, IconTile } from "@/components/ui/atoms";
import { rpc, fmtMin, todayStr } from "@/lib/helpers";
import { studyTodaySeconds } from "@/lib/game";
import { getStudyContent, getQuizQuestions, sig, type QQ } from "@/lib/study";
import { notifyParents } from "@/lib/push";
import type { Ctx, Kid, Subject } from "@/lib/types";
import { Play, Square, BookOpen, ListChecks, FileQuestion, Trophy, Clock, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";

export default function KidStudy({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const mine = db.subjects.filter((s) => s.kid_id === me.id && s.active);
  const goal = db.settings?.study_goal_seconds || 3600;
  const rewardPts = db.settings?.study_reward_points || 20;
  const todaySec = studyTodaySeconds(db.study_sessions, me.id);
  const reached = todaySec >= goal;
  const todayReward = db.study_rewards.find((r) => r.kid_id === me.id && r.day === todayStr());

  const [study, setStudy] = useState<Subject | null>(null);
  const [temario, setTemario] = useState<Subject | null>(null);
  const [test, setTest] = useState<Subject | null>(null);

  const seenFor = (sid: string) => new Set(db.study_questions_seen.filter((s) => s.kid_id === me.id && s.subject_id === sid).map((s) => s.q_sig));
  const testsToday = (sid: string) => db.test_sessions.filter((t) => t.kid_id === me.id && t.subject_id === sid && t.day === todayStr()).length;

  const claim = async () => {
    const { error } = await rpc("claim_study_reward", { p_kid: me.id, p_pin: kid!.pin, p_day: todayStr() });
    if (!error) notifyParents("Gánate el Verano", `${me.name} pide su recompensa de estudio`);
    flash(error ? error.message : "¡Recompensa solicitada! La aprueban tus padres."); refresh();
  };

  return (
    <div className="space-y-3 pb-6">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-navy tracking-tight">Tu hora de estudio de hoy</h3>
          <Clock size={18} className="text-teal" />
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-extrabold text-navy tabular-nums">{Math.floor(todaySec / 60)}</span>
          <span className="text-slate-400 font-semibold mb-1">/ {Math.round(goal / 60)} min</span>
        </div>
        <Bar v={todaySec} max={goal} c="#19D3AE" />
        <div className="mt-4">
          {todayReward ? (
            todayReward.status === "pending" ? <Chip tone="amber">Recompensa pendiente de aprobación</Chip>
              : todayReward.status === "approved" ? <Chip tone="green">¡Recompensa aprobada! +{todayReward.points} pts</Chip>
                : <Chip tone="slate">Recompensa rechazada</Chip>
          ) : reached ? (
            <Btn variant="primary" className="w-full flex items-center justify-center gap-2" onClick={claim}><Trophy size={18} /> Reclamar recompensa (+{rewardPts} pts)</Btn>
          ) : (
            <p className="text-sm text-slate-400 font-medium">Estudia {Math.ceil((goal - todaySec) / 60)} min más para desbloquear tu recompensa de hoy.</p>
          )}
        </div>
        <p className="text-[11px] text-slate-300 font-medium mt-3">El estudio real suma minuto a minuto. Cada test cuenta como máx. 5 min (3 por asignatura/día).</p>
      </Card>

      <h3 className="font-bold text-navy tracking-tight px-0.5 pt-1">Asignaturas</h3>
      {mine.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">Sin asignaturas todavía. Pídeselas a tus padres.</Card>}
      {mine.map((s) => {
        const left = 3 - testsToday(s.id);
        return (
          <Card key={s.id} className="p-4">
            <div className="flex items-center gap-3">
              <IconTile color="#19D3AE"><BookOpen size={20} /></IconTile>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy truncate">{s.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Total {fmtMin(s.total_seconds)} · Tests hoy {3 - left}/3</div>
              </div>
              <Chip tone="teal">{s.level}</Chip>
            </div>
            <div className="flex gap-2 mt-3">
              <Btn variant="teal" className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setStudy(s)}><Play size={15} /> Estudiar</Btn>
              <Btn variant="ghost" className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setTemario(s)}><ListChecks size={15} /> Temario</Btn>
              <Btn variant="dark" disabled={left <= 0} className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setTest(s)}><FileQuestion size={15} /> {left <= 0 ? "Hecho hoy" : "Test"}</Btn>
            </div>
          </Card>
        );
      })}

      {study && <ConcentrationModal ctx={ctx} me={me} subject={study} onClose={() => setStudy(null)} />}
      {temario && <TemarioModal subject={temario} onClose={() => setTemario(null)} />}
      {test && <TestModal ctx={ctx} me={me} subject={test} seen={seenFor(test.id)} onClose={() => setTest(null)} />}
    </div>
  );
}

function ConcentrationModal({ ctx, me, subject, onClose }: { ctx: Ctx; me: Kid; subject: Subject; onClose: () => void }) {
  const { flash, refresh, kid } = ctx;
  const [sec, setSec] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => { const t = setInterval(() => setSec((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const growth = Math.min(1, sec / 1500);
  const finish = async () => {
    setSaving(true);
    await rpc("log_study", { p_kid: me.id, p_pin: kid!.pin, p_subject: subject.id, p_seconds: sec });
    flash(`${Math.floor(sec / 60)} min de ${subject.name} registrados 🌳`);
    refresh(); onClose();
  };
  return (
    <Modal title={`Concentración · ${subject.name}`} onClose={onClose}>
      <div className="text-center py-4">
        <div className="mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-4" style={{ background: "radial-gradient(circle, rgba(25,211,174,0.18) 0%, rgba(25,211,174,0.04) 70%)" }}>
          <Sparkles size={40 + growth * 36} className="text-teal transition-all duration-1000" style={{ opacity: 0.4 + growth * 0.6 }} />
        </div>
        <div className="text-5xl font-extrabold tabular-nums text-navy">{String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}</div>
        <p className="text-sm text-slate-400 font-medium mt-2">{growth < 1 ? "Tu árbol está creciendo… no salgas o se marchita." : "¡Árbol completo! Sigue si quieres."}</p>
        <Btn variant="danger" className="w-full mt-6 flex items-center justify-center gap-2" onClick={finish} disabled={saving}><Square size={16} /> Finalizar y guardar</Btn>
      </div>
    </Modal>
  );
}

function TemarioModal({ subject, onClose }: { subject: Subject; onClose: () => void }) {
  const content = getStudyContent(subject.name, subject.level);
  return (
    <Modal title={`Temario · ${subject.name} (${subject.level})`} onClose={onClose}>
      <div className="space-y-2">
        {content.topics.map((t, i) => (
          <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3">
            <div className="w-7 h-7 rounded-lg bg-teal/12 text-teal font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</div>
            <span className="font-medium text-navy text-sm">{t}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 font-medium mt-4 text-center">Repasa estos puntos y luego ponte a prueba con el Test.</p>
    </Modal>
  );
}

function TestModal({ ctx, me, subject, seen, onClose }: { ctx: Ctx; me: Kid; subject: Subject; seen: Set<string>; onClose: () => void }) {
  const { flash, refresh, kid } = ctx;
  const [questions, setQuestions] = useState<QQ[]>(() => getQuizQuestions(subject.name, subject.level, seen, 5));
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/generate-questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject: subject.name, level: subject.level, n: 5 }) });
        const d = await r.json();
        const qs: QQ[] = (d.questions || [])
          .filter((q: { q?: string; options?: string[]; answer?: number }) => q && q.q && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === "number")
          .map((q: { q: string; options: string[]; answer: number }) => ({ q: q.q, options: q.options, answer: q.answer, sig: sig("ai|" + q.q) }))
          .filter((q: QQ) => !seen.has(q.sig));
        if (alive && qs.length >= 4) setQuestions(qs.slice(0, 5));
      } catch { /* usa el banco local */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const start = useRef(Date.now());
  const log = useRef<{ sig: string; correct: boolean }[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ awarded: number; suspicious: boolean } | null>(null);
  const q = questions[i];

  const choose = (opt: number) => {
    if (picked !== null) return;
    setPicked(opt);
    const ok = opt === q.answer;
    if (ok) setScore((s) => s + 1);
    log.current.push({ sig: q.sig, correct: ok });
  };
  const next = async () => {
    if (i + 1 < questions.length) { setI(i + 1); setPicked(null); return; }
    const elapsed = Math.round((Date.now() - start.current) / 1000);
    const { data, error } = await rpc("finish_test", {
      p_kid: me.id, p_pin: kid!.pin, p_subject: subject.id,
      p_score: score, p_total: questions.length, p_elapsed: elapsed,
      p_sigs: log.current.map((l) => l.sig), p_correct: log.current.map((l) => l.correct),
    });
    if (error) { flash(error.message); onClose(); return; }
    const r = (data || {}) as { awarded?: number; suspicious?: boolean };
    setResult({ awarded: r.awarded ?? 300, suspicious: !!r.suspicious });
    if (!r.suspicious) notifyParents("Gánate el Verano", `${me.name} ha hecho un test de ${subject.name}`);
    setDone(true); refresh();
  };

  if (done && result) {
    const total = questions.length;
    return (
      <Modal title="Resultado del test" onClose={onClose}>
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-3xl bg-teal/12 text-teal mx-auto flex items-center justify-center mb-3"><CheckCircle2 size={40} /></div>
          <div className="text-3xl font-extrabold text-navy">{score} / {total}</div>
          <p className="text-slate-500 font-medium mt-1">{score === total ? "¡Perfecto! Crack." : score >= total / 2 ? "¡Bien! Sigue repasando." : "A repasar el temario y vuelve a intentarlo."}</p>
          <p className="text-xs text-teal font-semibold mt-3">+{Math.round(result.awarded / 60)} min de estudio sumados</p>
          {result.suspicious && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2 text-left">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-amber-700">Has respondido muy rápido. El estudio real cuenta más que los tests: la recompensa de este test es menor y tus padres lo revisarán.</span>
            </div>
          )}
          <Btn variant="primary" className="w-full mt-5" onClick={onClose}>Hecho</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Test · ${subject.name}`} onClose={onClose}>
      <div className="text-xs font-semibold text-slate-400 mb-1">Pregunta {i + 1} de {questions.length}</div>
      <Bar v={i} max={questions.length} c="#19D3AE" />
      <h4 className="font-bold text-navy text-lg mt-4 mb-3">{q.q}</h4>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const show = picked !== null;
          const cls = show
            ? idx === q.answer ? "border-teal bg-teal/10 text-navy"
              : idx === picked ? "border-red-300 bg-red-50 text-red-500" : "border-slate-200 text-slate-400"
            : "border-slate-200 hover:border-brand text-navy";
          return <button key={idx} onClick={() => choose(idx)} className={`w-full text-left rounded-xl border px-4 py-3 font-medium text-sm transition ${cls}`}>{opt}</button>;
        })}
      </div>
      {picked !== null && <Btn variant="primary" className="w-full mt-4" onClick={next}>{i + 1 < questions.length ? "Siguiente" : "Ver resultado"}</Btn>}
    </Modal>
  );
}
