"use client";
import { Card, Avatar, Bar, Btn, Stat } from "@/components/ui/atoms";
import { last7 } from "@/lib/helpers";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { Users, ClipboardCheck, Target, Sparkles, Star, ArrowRight, FlaskConical, Trophy, CalendarDays, CalendarRange, CalendarClock, CalendarCheck } from "lucide-react";

const FREQS: { key: string; label: string; Icon: typeof CalendarDays; color: string }[] = [
  { key: "diaria", label: "Diarias", Icon: CalendarDays, color: "#FF8A00" },
  { key: "semanal", label: "Semanales", Icon: CalendarRange, color: "#19D3AE" },
  { key: "quincenal", label: "Quincenales", Icon: CalendarClock, color: "#3B82F6" },
  { key: "mensual", label: "Mensuales", Icon: CalendarCheck, color: "#A855F7" },
];

export default function AdminResumen({ ctx, onGo }: { ctx: Ctx; onGo: (t: string) => void }) {
  const { db } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const pend = db.assignments.filter((a) => a.status === "pending").length + db.redemptions.filter((r) => r.status === "pending").length + db.gifts.filter((g) => g.status === "pending").length + db.study_rewards.filter((r) => r.status === "pending").length;
  const xpTotal = db.kids.reduce((s, k) => s + k.total_points, 0);
  const weekFromAsg = (k: Kid) => db.assignments.filter((a) => a.kid_id === k.id && a.status === "approved" && last7(a.validated_at)).reduce((s, a) => s + a.points, 0);
  const star = [...db.kids].map((k) => ({ k, w: weekFromAsg(k) })).sort((a, b) => b.w - a.w)[0];

  const teams = db.teams.map((t) => { const ms = db.kids.filter((k) => k.team_id === t.id); return { t, members: ms.length, points: ms.reduce((s, k) => s + k.total_points, 0) }; }).sort((a, b) => b.points - a.points);
  const teamMax = teams[0]?.points || 1;
  const tasksByFreq = (f: string) => db.tasks.filter((t) => t.active && t.frequency === f).length;
  const pendByFreq = (f: string) => db.assignments.filter((a) => a.status !== "approved" && db.tasks.find((t) => t.id === a.task_id)?.frequency === f).length;
  const medal = ["#FACC15", "#CBD5E1", "#D8A36B"];

  return (
    <div className="space-y-5">
      <Card className="p-4 bg-navy/[0.03] border-navy/10">
        <div className="flex items-center gap-2 mb-2"><FlaskConical size={16} className="text-brand" /><h3 className="font-bold text-navy tracking-tight text-sm">Modo test · ver panel de un hijo</h3></div>
        <div className="flex flex-wrap gap-2">
          {db.kids.map((k) => (
            <button key={k.id} onClick={() => { ctx.setKid(k); ctx.setScreen("kid"); }} className="flex items-center gap-2 text-sm font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-navy hover:border-brand">
              <Avatar name={k.name} color={k.color} size={20} avatar={k.avatar} />{k.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Hijos" value={db.kids.length} accent="#3B82F6" icon={<Users size={18} />} />
        <Stat label="Pendiente de validar" value={pend} accent="#FF8A00" icon={<ClipboardCheck size={18} />} />
        <Stat label="Misiones activas" value={db.tasks.filter((t) => t.active).length} accent="#19D3AE" icon={<Target size={18} />} />
        <Stat label="Puntos en juego" value={xpTotal} accent="#A855F7" icon={<Sparkles size={18} />} />
      </div>

      {/* RANKING DE EQUIPOS — primero */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4"><Trophy size={18} className="text-brand" /><h3 className="font-bold text-navy tracking-tight">Ranking de equipos</h3></div>
        <div className="space-y-3">
          {teams.map((t, i) => (
            <div key={t.t.id} className={`flex items-center gap-3 rounded-2xl p-3 ${i === 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50"}`}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-white text-sm" style={{ background: i < 3 ? medal[i] : "#94A3B8" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-bold text-navy flex items-center gap-2 truncate"><span className="w-3 h-3 rounded-full" style={{ background: t.t.color }} />{t.t.name} <span className="text-slate-400 font-medium">· {t.members}</span></span>
                  <span className="font-extrabold text-navy tabular-nums">{t.points}</span>
                </div>
                <Bar v={t.points} max={teamMax} c={t.t.color} />
              </div>
            </div>
          ))}
          {teams.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Crea equipos en la pestaña Hijos.</p>}
        </div>
      </Card>

      {/* MISIONES POR FRECUENCIA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {FREQS.map((f) => (
          <Card key={f.key} className="p-4">
            <div className="flex items-center gap-2 mb-2" style={{ color: f.color }}><f.Icon size={18} /><span className="text-xs font-semibold text-slate-400">{f.label}</span></div>
            <div className="text-2xl font-extrabold text-navy tabular-nums">{tasksByFreq(f.key)}</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">{pendByFreq(f.key)} en curso</div>
          </Card>
        ))}
      </div>

      {/* RANKING INDIVIDUAL + lateral */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-navy tracking-tight mb-3">Ranking individual</h3>
          {ranking.map((k, i) => (
            <div key={k.id} className="flex items-center gap-3 py-2">
              <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
              <Avatar name={k.name} color={k.color} size={34} avatar={k.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-bold text-navy tabular-nums">{k.total_points}</span></div>
                <div className="mt-1"><Bar v={k.total_points} max={max} c={k.color} /></div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Nv {levelOf(k.total_points)}</span>
            </div>
          ))}
          {ranking.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Añade hijos para ver el ranking.</p>}
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
        </div>
      </div>
    </div>
  );
}
