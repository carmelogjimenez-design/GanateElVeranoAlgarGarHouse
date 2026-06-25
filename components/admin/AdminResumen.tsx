"use client";
import { Card, Avatar, Bar } from "@/components/ui/atoms";
import { last7 } from "@/lib/helpers";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import ActivityWall from "@/components/ActivityWall";
import { Star, ArrowRight, FlaskConical, Trophy, CalendarDays, CalendarRange, CalendarClock, CalendarCheck } from "lucide-react";

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

  const heroStats = [
    { label: "Hijos", value: db.kids.length },
    { label: "Misiones activas", value: db.tasks.filter((t) => t.active).length },
    { label: "Puntos en juego", value: xpTotal },
  ];

  return (
    <div className="space-y-5">
      {/* ===== HÉROE · CENTRO DE MANDO ===== */}
      <div className="relative overflow-hidden rounded-[26px] p-6 sm:p-7 text-white" style={{ background: "linear-gradient(135deg,#FF6B5E 0%,#FF8A4C 55%,#FF9F45 100%)", boxShadow: "0 24px 60px -24px rgba(255,107,94,.6)" }}>
        <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.16)", filter: "blur(6px)" }} />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.10)", filter: "blur(8px)" }} />
        <div className="relative">
          <div className="text-[11px] font-bold tracking-[.2em] uppercase text-white/75">Centro de mando</div>
          <h2 className="text-2xl sm:text-[28px] font-black tracking-tight mt-1 leading-tight">
            {pend > 0 ? <>Tienes <span className="tabular-nums">{pend}</span> {pend === 1 ? "cosa" : "cosas"} por validar</> : <>Todo al día <span className="align-middle">✨</span></>}
          </h2>
          <p className="text-white/80 text-sm font-medium mt-1.5">{pend > 0 ? "Aprueba o rechaza para que tus hijos sumen sus puntos." : "No hay nada pendiente. Reina la paz… por ahora."}</p>

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,.15)" }}>
                <div className="text-xl font-black tabular-nums leading-none">{s.value}</div>
                <div className="text-[11px] font-semibold text-white/75 mt-1">{s.label}</div>
              </div>
            ))}
            {pend > 0 && (
              <button onClick={() => onGo("validar")} className="sm:ml-auto flex items-center gap-2 rounded-2xl px-5 py-3 font-bold text-[15px] active:scale-95 transition shadow-lg" style={{ background: "#fff", color: "#FF6B5E" }}>
                Revisar ahora <ArrowRight size={17} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODO TEST (discreto) ===== */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2.5"><FlaskConical size={15} className="text-brand" /><h3 className="font-bold text-navy tracking-tight text-sm">Modo test · entra como un hijo</h3></div>
        <div className="flex flex-wrap gap-2">
          {db.kids.map((k) => (
            <button key={k.id} onClick={() => { ctx.setKid(k); ctx.setScreen("kid"); }} className="flex items-center gap-2 text-sm font-semibold pl-1.5 pr-3.5 py-1.5 rounded-full bg-white/70 border border-white/80 text-navy hover:border-brand transition active:scale-95">
              <Avatar name={k.name} color={k.color} size={22} avatar={k.avatar} />{k.name}
            </button>
          ))}
        </div>
      </Card>

      {/* ===== RANKING DE EQUIPOS ===== */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4"><Trophy size={18} style={{ color: "#FF9F45" }} /><h3 className="font-bold text-navy tracking-tight">Ranking de equipos</h3></div>
        <div className="space-y-2.5">
          {teams.map((t, i) => (
            <div key={t.t.id} className="flex items-center gap-3 rounded-2xl p-3" style={i === 0 ? { background: "linear-gradient(90deg,rgba(250,204,21,.16),rgba(250,204,21,.03))", border: "1px solid rgba(250,204,21,.45)" } : { background: "rgba(255,255,255,.5)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0" style={{ background: i < 3 ? medal[i] : "#94A3B8" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-bold text-navy flex items-center gap-2 truncate"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.t.color }} />{t.t.name} <span className="text-slate-400 font-medium">· {t.members}</span></span>
                  <span className="font-black text-navy tabular-nums">{t.points}</span>
                </div>
                <Bar v={t.points} max={teamMax} c={t.t.color} />
              </div>
            </div>
          ))}
          {teams.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Crea equipos en la pestaña Hijos.</p>}
        </div>
      </Card>

      {/* ===== INDIVIDUAL + LATERAL ===== */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3"><Trophy size={18} style={{ color: "#FF6B5E" }} /><h3 className="font-bold text-navy tracking-tight">Ranking individual</h3></div>
          <div className="space-y-0.5">
            {ranking.map((k, i) => (
              <div key={k.id} className="flex items-center gap-3 py-2 px-2 rounded-2xl">
                <span className={`w-6 text-center text-sm font-black ${i < 3 ? "text-navy" : "text-slate-300"}`}>{i + 1}</span>
                <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-black text-navy tabular-nums">{k.total_points}</span></div>
                  <Bar v={k.total_points} max={max} c={k.color} />
                </div>
                <span className="text-[11px] text-slate-400 font-semibold shrink-0">Nv {levelOf(k.total_points)}</span>
              </div>
            ))}
            {ranking.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Añade hijos para ver el ranking.</p>}
          </div>
        </Card>

        <div className="space-y-5">
          {star && star.w > 0 && (
            <div className="relative overflow-hidden rounded-[24px] p-5 text-white" style={{ background: "linear-gradient(135deg,#0B1F3A,#15315c)", boxShadow: "0 18px 44px -22px rgba(11,31,58,.55)" }}>
              <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full pointer-events-none" style={{ background: "rgba(255,159,69,.18)", filter: "blur(6px)" }} />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,159,69,.2)", color: "#FF9F45" }}><Star size={24} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold tracking-[.14em] uppercase text-white/55">Hijo de la semana</div>
                  <div className="text-xl font-black tracking-tight truncate">{star.k.name}</div>
                </div>
                <div className="text-right shrink-0"><div className="text-2xl font-black" style={{ color: "#19D3AE" }}>{star.w}</div><div className="text-[11px] text-white/55">pts</div></div>
              </div>
            </div>
          )}

          <Card className="p-5">
            <h3 className="font-bold text-navy tracking-tight mb-3.5">Catálogo por frecuencia</h3>
            <div className="space-y-3">
              {FREQS.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}1a`, color: f.color }}><f.Icon size={17} /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-navy">{f.label}</div><div className="text-[11px] text-slate-400 font-medium">{pendByFreq(f.key)} en curso</div></div>
                  <div className="text-lg font-black text-navy tabular-nums">{tasksByFreq(f.key)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ActivityWall ctx={ctx} author="Papá / Mamá" />
    </div>
  );
}
