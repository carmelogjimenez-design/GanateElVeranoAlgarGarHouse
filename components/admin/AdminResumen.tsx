"use client";
import { Card, Avatar, Bar, Btn, Stat } from "@/components/ui/atoms";
import { rpc, last7 } from "@/lib/helpers";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { Users, ClipboardCheck, Target, Sparkles, Star, Scale, ArrowRight, FlaskConical } from "lucide-react";

export default function AdminResumen({ ctx, onGo }: { ctx: Ctx; onGo: (t: string) => void }) {
  const { db, refresh, flash } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const pend = db.assignments.filter((a) => a.status === "pending").length + db.redemptions.filter((r) => r.status === "pending").length + db.gifts.filter((g) => g.status === "pending").length;
  const xpTotal = db.kids.reduce((s, k) => s + k.total_points, 0);
  const weekFromAsg = (k: Kid) => db.assignments.filter((a) => a.kid_id === k.id && a.status === "approved" && last7(a.validated_at)).reduce((s, a) => s + a.points, 0);
  const star = [...db.kids].map((k) => ({ k, w: weekFromAsg(k) })).sort((a, b) => b.w - a.w)[0];

  const punish = async () => {
    const kidName = prompt("Nombre exacto del hijo a penalizar:");
    const k = db.kids.find((x) => x.name.toLowerCase() === (kidName || "").toLowerCase());
    if (!k) return flash("No encuentro ese hijo");
    const pts = +(prompt("Puntos a restar (positivo):", "5") || 0);
    const why = prompt("Motivo:", "Mala actitud") || "";
    const { error } = await rpc("apply_points", { p_kid: k.id, p_delta: -Math.abs(pts), p_reason: why, p_type: "penalty" });
    flash(error ? error.message : `-${Math.abs(pts)} a ${k.name}`); refresh();
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 bg-navy/[0.03] border-navy/10">
        <div className="flex items-center gap-2 mb-2"><FlaskConical size={16} className="text-brand" /><h3 className="font-bold text-navy tracking-tight text-sm">Modo test · ver panel de un hijo</h3></div>
        <div className="flex flex-wrap gap-2">
          {db.kids.map((k) => (
            <button key={k.id} onClick={() => { ctx.setKid(k); ctx.setScreen("kid"); }}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-navy hover:border-brand">{k.name}</button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Hijos" value={db.kids.length} accent="#3B82F6" icon={<Users size={18} />} />
        <Stat label="Pendiente de validar" value={pend} accent="#FF8A00" icon={<ClipboardCheck size={18} />} />
        <Stat label="Misiones activas" value={db.tasks.filter((t) => t.active).length} accent="#19D3AE" icon={<Target size={18} />} />
        <Stat label="Puntos en juego" value={xpTotal} accent="#A855F7" icon={<Sparkles size={18} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-navy tracking-tight mb-3">Clasificación</h3>
          {ranking.map((k, i) => (
            <div key={k.id} className="flex items-center gap-3 py-2">
              <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
              <Avatar name={k.name} color={k.color} size={34} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-bold text-navy tabular-nums">{k.total_points}</span></div>
                <div className="mt-1"><Bar v={k.total_points} max={max} c={k.color} /></div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Nv {levelOf(k.total_points)}</span>
            </div>
          ))}
        </Card>

        <div className="space-y-4">
          {star && star.w > 0 && (
            <Card className="bg-navy border-navy p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand/20 text-brand flex items-center justify-center"><Star size={22} /></div>
                <div className="flex-1"><div className="text-xs opacity-60 font-medium">Hijo de la semana</div><div className="text-xl font-extrabold tracking-tight">{star.k.name}</div></div>
                <div className="text-right"><div className="text-2xl font-extrabold text-teal">{star.w}</div><div className="text-[11px] opacity-60">pts</div></div>
              </div>
            </Card>
          )}
          <Card className="p-5">
            <div className="text-xs font-medium text-slate-400">Cola de validación</div>
            <div className="text-3xl font-extrabold text-navy mt-1">{pend}</div>
            <Btn variant="primary" className="w-full mt-3 flex items-center justify-center gap-2" onClick={() => onGo("validar")}>Revisar ahora <ArrowRight size={16} /></Btn>
          </Card>
          <Btn variant="danger" className="w-full flex items-center justify-center gap-2" onClick={punish}><Scale size={18} /> Aplicar penalización</Btn>
        </div>
      </div>
    </div>
  );
}
