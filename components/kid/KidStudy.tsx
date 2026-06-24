"use client";
import { useState, useEffect } from "react";
import { Chip, Btn } from "@/components/ui/atoms";
import { rpc, fmtMin, last7 } from "@/lib/helpers";
import type { Ctx, Kid } from "@/lib/types";

export default function KidStudy({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const mine = db.subjects.filter((s) => s.kid_id === me.id && s.active);
  const [run, setRun] = useState<{ id: string; start: number } | null>(null);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setSec(Math.floor((Date.now() - run.start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [run]);
  const stop = async () => {
    if (!run) return;
    await rpc("log_study", { p_kid: me.id, p_pin: kid!.pin, p_subject: run.id, p_seconds: sec });
    flash(`Has estudiado ${Math.floor(sec / 60)} min. La ciencia sigue sin explicarlo.`);
    setRun(null); setSec(0); refresh();
  };
  const weekSec = (id: string) =>
    db.study_sessions.filter((s) => s.subject_id === id && last7(s.created_at)).reduce((a, b) => a + b.seconds, 0);
  return (
    <div className="space-y-3 pb-6">
      {mine.length === 0 && <p className="text-slate-400 font-semibold text-center py-6">Sin asignaturas todavía. Disfrútalo.</p>}
      {mine.map((s) => (
        <div key={s.id} className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex justify-between"><span className="font-black">{s.name}</span><Chip c="#8b5cf6">{s.level}</Chip></div>
          <div className="text-xs text-slate-500 mt-1">Total {fmtMin(s.total_seconds)} · Semana {fmtMin(weekSec(s.id))}</div>
          {run?.id === s.id ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-black tabular-nums">
                {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}
              </span>
              <Btn c="bg-red-500" className="flex-1" onClick={stop}>⏹ Finalizar</Btn>
            </div>
          ) : (
            <Btn c="bg-violet-500" className="w-full mt-3" onClick={() => { setRun({ id: s.id, start: Date.now() }); setSec(0); }}>▶ Empezar a estudiar</Btn>
          )}
        </div>
      ))}
    </div>
  );
}
