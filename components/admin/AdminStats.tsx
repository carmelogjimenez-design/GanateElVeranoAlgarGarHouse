"use client";
import { Card, Avatar, Bar, Btn } from "@/components/ui/atoms";
import { rpc, last7 } from "@/lib/helpers";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { Star, Scale } from "lucide-react";

export default function AdminStats({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const weekFromAsg = (k: Kid) => db.assignments.filter((a) => a.kid_id === k.id && a.status === "approved" && last7(a.validated_at)).reduce((s, a) => s + a.points, 0);
  const star = [...db.kids].map((k) => ({ k, w: weekFromAsg(k) })).sort((a, b) => b.w - a.w)[0];

  const punish = async () => {
    const kidName = prompt("Nombre exacto del hijo a penalizar:");
    const k = db.kids.find((x) => x.name.toLowerCase() === (kidName || "").toLowerCase());
    if (!k) return flash("No encuentro ese hijo");
    const pts = +(prompt("XP a restar (positivo):", "5") || 0);
    const why = prompt("Motivo:", "Mala actitud") || "";
    const { error } = await rpc("apply_points", { p_kid: k.id, p_delta: -Math.abs(pts), p_reason: why, p_type: "penalty" });
    flash(error ? error.message : `-${Math.abs(pts)} XP a ${k.name}`); refresh();
  };

  return (
    <div className="pb-6 space-y-4">
      {star && star.w > 0 && (
        <Card className="bg-navy border-navy p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand/20 text-brand flex items-center justify-center"><Star size={22} /></div>
            <div className="flex-1"><div className="text-xs opacity-60 font-medium">Hijo de la semana</div><div className="text-xl font-extrabold tracking-tight">{star.k.name}</div></div>
            <div className="text-right"><div className="text-2xl font-extrabold text-teal">{star.w}</div><div className="text-[11px] opacity-60">XP / semana</div></div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-bold text-navy tracking-tight mb-3">Clasificación</h3>
        {ranking.map((k, i) => (
          <div key={k.id} className="flex items-center gap-3 py-2">
            <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
            <Avatar name={k.name} color={k.color} size={34} avatar={k.avatar} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-bold text-navy tabular-nums">{k.total_points} XP</span></div>
              <div className="mt-1"><Bar v={k.total_points} max={max} c={k.color} /></div>
            </div>
            <span className="text-xs text-slate-400 font-medium">Nv {levelOf(k.total_points)}</span>
          </div>
        ))}
      </Card>

      <Btn variant="danger" className="w-full flex items-center justify-center gap-2" onClick={punish}><Scale size={18} /> Aplicar penalización</Btn>
    </div>
  );
}
