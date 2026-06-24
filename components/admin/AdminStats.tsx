"use client";
import { Bar, Btn } from "@/components/ui/atoms";
import { rpc, last7 } from "@/lib/helpers";
import type { Ctx, Kid } from "@/lib/types";

export default function AdminStats({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;

  const weekFromAsg = (k: Kid) =>
    db.assignments
      .filter((a) => a.kid_id === k.id && a.status === "approved" && last7(a.validated_at))
      .reduce((s, a) => s + a.points, 0);
  const star = [...db.kids].map((k) => ({ k, w: weekFromAsg(k) })).sort((a, b) => b.w - a.w)[0];

  const punish = async () => {
    const kidName = prompt("Nombre exacto del hijo a penalizar:");
    const k = db.kids.find((x) => x.name.toLowerCase() === (kidName || "").toLowerCase());
    if (!k) return flash("No encuentro ese hijo");
    const pts = +(prompt("Puntos a restar (positivo):", "5") || 0);
    const why = prompt("Motivo:", "Mala actitud") || "";
    const { error } = await rpc("apply_points", { p_kid: k.id, p_delta: -Math.abs(pts), p_reason: why, p_type: "penalty" });
    flash(error ? error.message : `-${Math.abs(pts)} a ${k.name}`);
    refresh();
  };

  return (
    <div className="pb-6 space-y-4">
      {star && star.w > 0 && (
        <div className="bg-yellow-100 rounded-3xl p-4 shadow-sm text-center">
          <div className="text-sm font-bold text-yellow-700">⭐ Hijo de la semana</div>
          <div className="text-2xl font-black">{star.k.emoji} {star.k.name}</div>
          <div className="font-bold text-yellow-700">{star.w} pts esta semana</div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-4 shadow-sm">
        <h3 className="font-black mb-3">Clasificación</h3>
        {ranking.map((k, i) => (
          <div key={k.id} className="flex items-center gap-3 py-1.5">
            <span className="w-5 text-center font-black text-slate-400">{i + 1}</span>
            <span className="text-xl">{k.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-bold"><span>{k.name}</span><span>{k.total_points}</span></div>
              <Bar v={k.total_points} max={max} c={k.color} />
            </div>
          </div>
        ))}
      </div>

      <Btn c="bg-red-500" className="w-full" onClick={punish}>⚖️ Restar puntos / castigo</Btn>
    </div>
  );
}
