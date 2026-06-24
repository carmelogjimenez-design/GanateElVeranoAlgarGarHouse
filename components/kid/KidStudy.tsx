"use client";
import { useState, useEffect } from "react";
import { Card, Btn, Chip } from "@/components/ui/atoms";
import { rpc, fmtMin, last7 } from "@/lib/helpers";
import type { Ctx, Kid } from "@/lib/types";
import { Play, Square, BookOpen } from "lucide-react";

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
    flash(`${Math.floor(sec / 60)} min de estudio registrados.`);
    setRun(null); setSec(0); refresh();
  };
  const weekSec = (id: string) => db.study_sessions.filter((s) => s.subject_id === id && last7(s.created_at)).reduce((a, b) => a + b.seconds, 0);
  return (
    <div className="space-y-2.5 pb-6">
      <h3 className="font-bold text-navy tracking-tight px-0.5 mb-1">Modo estudio</h3>
      {mine.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">Sin asignaturas todavía.</Card>}
      {mine.map((s) => {
        const running = run?.id === s.id;
        return (
          <Card key={s.id} className={`p-4 ${running ? "ring-2 ring-teal border-teal" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal/12 text-teal flex items-center justify-center"><BookOpen size={20} /></div>
              <div className="flex-1">
                <div className="font-semibold text-navy">{s.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">Total {fmtMin(s.total_seconds)} · Semana {fmtMin(weekSec(s.id))}</div>
              </div>
              <Chip tone="teal">{s.level}</Chip>
            </div>
            {running ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="text-4xl font-extrabold tabular-nums text-navy">{String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}</div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">Modo concentración</div>
                </div>
                <Btn variant="danger" className="flex items-center gap-2" onClick={stop}><Square size={16} /> Finalizar</Btn>
              </div>
            ) : (
              <Btn variant="teal" className="w-full mt-3 flex items-center justify-center gap-2" onClick={() => { setRun({ id: s.id, start: Date.now() }); setSec(0); }}><Play size={18} /> Iniciar sesión</Btn>
            )}
          </Card>
        );
      })}
    </div>
  );
}
