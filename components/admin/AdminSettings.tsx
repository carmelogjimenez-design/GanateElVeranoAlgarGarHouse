"use client";
import { useState } from "react";
import { Card, Btn, Input } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import type { Ctx } from "@/lib/types";

export default function AdminSettings({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const s = db.settings;
  const [f, setF] = useState({
    team_goal: s?.team_goal ?? 200,
    challenge_label: s?.challenge_label ?? "Reto de equipo",
    challenge_until: s?.challenge_until ?? "",
    weekly_goal_default: s?.weekly_goal_default ?? 100,
    study_reward_points: s?.study_reward_points ?? 20,
    study_goal_min: Math.round((s?.study_goal_seconds ?? 3600) / 60),
  });
  const save = async () => {
    const { error } = await sb.from("settings").update({
      team_goal: f.team_goal, challenge_label: f.challenge_label,
      challenge_until: f.challenge_until || null, weekly_goal_default: f.weekly_goal_default,
      study_reward_points: f.study_reward_points, study_goal_seconds: f.study_goal_min * 60,
    }).eq("id", 1);
    flash(error ? error.message : "Ajustes guardados"); refresh();
  };
  const applyToAll = async () => {
    const { error } = await sb.from("kids").update({ weekly_goal: f.weekly_goal_default }).neq("id", "00000000-0000-0000-0000-000000000000");
    flash(error ? error.message : "Objetivo aplicado a todos los hijos"); refresh();
  };
  return (
    <div className="max-w-2xl space-y-4 pb-6">
      <Card className="p-5 space-y-3">
        <h3 className="font-bold text-navy tracking-tight">Reto de equipo</h3>
        <div><label className="text-sm font-semibold text-navy">Nombre del reto</label><Input value={f.challenge_label} onChange={(e) => setF({ ...f, challenge_label: e.target.value })} className="mt-1.5" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-semibold text-navy">Meta (pts)</label><Input type="number" value={f.team_goal} onChange={(e) => setF({ ...f, team_goal: +e.target.value })} className="mt-1.5" /></div>
          <div><label className="text-sm font-semibold text-navy">Termina el</label><Input type="date" value={f.challenge_until} onChange={(e) => setF({ ...f, challenge_until: e.target.value })} className="mt-1.5" /></div>
        </div>
        <Btn variant="primary" className="w-full" onClick={save}>Guardar ajustes</Btn>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-bold text-navy tracking-tight">Estudio</h3>
        <p className="text-sm text-slate-400 font-medium">Cuando un hijo estudia el tiempo objetivo en un día, puede reclamar una recompensa que tú apruebas en "Validar".</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-semibold text-navy">Objetivo diario (min)</label><Input type="number" value={f.study_goal_min} onChange={(e) => setF({ ...f, study_goal_min: +e.target.value })} className="mt-1.5" /></div>
          <div><label className="text-sm font-semibold text-navy">Recompensa (pts)</label><Input type="number" value={f.study_reward_points} onChange={(e) => setF({ ...f, study_reward_points: +e.target.value })} className="mt-1.5" /></div>
        </div>
        <Btn variant="primary" className="w-full" onClick={save}>Guardar ajustes</Btn>
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-sm text-slate-400 font-medium">Cada hijo tiene su propia meta (editable en su ficha). Aquí puedes fijar una común y aplicarla a todos.</p>
        <div className="flex gap-2">
          <Input type="number" value={f.weekly_goal_default} onChange={(e) => setF({ ...f, weekly_goal_default: +e.target.value })} className="w-28" />
          <Btn variant="dark" className="flex-1" onClick={applyToAll}>Aplicar a todos</Btn>
        </div>
      </Card>
    </div>
  );
}
