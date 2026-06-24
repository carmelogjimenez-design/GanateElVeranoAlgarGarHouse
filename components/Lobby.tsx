"use client";
import { Card, Avatar, Bar } from "@/components/ui/atoms";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { Trophy, Flag, LogIn, Users, Sparkles, ChevronRight } from "lucide-react";

const MEDAL = ["#FACC15", "#CBD5E1", "#D8A36B"];

export default function Lobby({ ctx, onKid, onLogin }: { ctx: Ctx; onKid: (k: Kid) => void; onLogin: () => void }) {
  const { db } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as Kid[]; // 2º · 1º · 3º
  const podiumH = [88, 116, 64];
  const teamScores = db.teams.map((t) => ({ ...t, pts: db.kids.filter((k) => k.team_id === t.id).reduce((s, k) => s + k.total_points, 0) })).sort((a, b) => b.pts - a.pts);
  const tMax = teamScores[0]?.pts || 1;
  const totalXp = db.kids.reduce((s, k) => s + Math.max(0, k.total_points), 0);
  const players = db.kids.filter((k) => k.active).length;

  return (
    <div className="min-h-screen pb-16">
      {/* HERO */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(140deg,#0B1F3A 0%,#13315c 50%,#0B1F3A 100%)" }}>
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: "radial-gradient(circle,#FF8A00,transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle,#19D3AE,transparent 70%)" }} />
        <div className="absolute top-10 left-1/2 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle,#EAB308,transparent 70%)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-12 text-center">
          <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-white/60 bg-white/10 rounded-full px-3 py-1.5 mb-5">Casa Algar · Verano 2026</span>
          <img src="/logo.png" alt="Gánate el Verano" className="h-44 md:h-56 w-auto object-contain mx-auto drop-shadow-2xl" />
          <p className="text-white/70 font-medium mt-3 text-lg">Disfruta del verano… o quédate en casa.</p>
          <button onClick={onLogin} className="mt-6 inline-flex items-center gap-2 bg-white text-navy font-bold rounded-2xl px-7 py-3.5 shadow-xl active:scale-95 transition hover:shadow-2xl">
            <LogIn size={19} /> Entrar / Crear cuenta
          </button>
          <div className="flex items-center justify-center gap-3 md:gap-5 mt-8">
            <Stat icon={<Users size={15} />} value={players} label="jugadores" />
            <span className="w-px h-8 bg-white/15" />
            <Stat icon={<Flag size={15} />} value={db.teams.length} label="equipos" />
            <span className="w-px h-8 bg-white/15" />
            <Stat icon={<Sparkles size={15} />} value={totalXp} label="XP en juego" />
          </div>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none" style={{ height: 48 }}><path fill="#F8FAFC" d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 L0,80 Z" /></svg>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-2">
        {/* PODIO */}
        {top3.length >= 2 && (
          <Card className="p-6 mb-5">
            <div className="flex items-center gap-2 mb-5"><Trophy size={18} className="text-brand" /><h2 className="font-extrabold text-navy tracking-tight">Podio</h2></div>
            <div className="flex items-end justify-center gap-3 md:gap-6">
              {order.map((k) => {
                const place = ranking.indexOf(k);
                return (
                  <div key={k.id} className="flex flex-col items-center flex-1 max-w-[140px]">
                    <Avatar name={k.name} color={k.color} size={place === 0 ? 64 : 52} avatar={k.avatar} />
                    <div className="font-bold text-navy text-sm mt-2 truncate w-full text-center">{k.name}</div>
                    <div className="text-xs font-semibold text-slate-400">{k.total_points} XP</div>
                    <div className="w-full rounded-t-2xl mt-2 flex items-start justify-center pt-2 font-extrabold text-white text-lg" style={{ height: podiumH[place], background: `linear-gradient(180deg,${MEDAL[place]},${MEDAL[place]}99)` }}>{place + 1}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {/* CLASIFICACIÓN */}
          <Card className="p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-3"><Trophy size={18} className="text-brand" /><h2 className="font-extrabold text-navy tracking-tight">Clasificación</h2></div>
            <div className="grid sm:grid-cols-2 sm:gap-x-8">
              {ranking.map((k, i) => (
                <div key={k.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0" style={{ background: i < 3 ? MEDAL[i] : "#E2E8F0", color: i < 3 ? "#fff" : "#94A3B8" }}>{i + 1}</span>
                  <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-sm"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-extrabold text-navy tabular-nums">{k.total_points}</span></div>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold text-slate-400 shrink-0">Nv{levelOf(k.total_points)}</span><div className="flex-1"><Bar v={Math.max(0, k.total_points)} max={max} c={k.color} /></div></div>
                  </div>
                </div>
              ))}
              {ranking.length === 0 && <p className="text-slate-400 text-sm font-medium py-4">Aún no hay jugadores.</p>}
            </div>
          </Card>

          {/* EQUIPOS */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Flag size={18} className="text-teal" /><h2 className="font-extrabold text-navy tracking-tight">Equipos</h2></div>
            <div className="space-y-2.5">
              {teamScores.map((t, i) => (
                <div key={t.id} className="rounded-2xl p-3" style={{ background: i === 0 ? "#FFF7ED" : "#F8FAFC" }}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-bold text-navy flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.name}</span>
                    <span className="font-extrabold text-navy tabular-nums">{t.pts}</span>
                  </div>
                  <Bar v={Math.max(0, t.pts)} max={tMax} c={t.color} />
                </div>
              ))}
              {teamScores.length === 0 && <p className="text-slate-400 text-sm font-medium py-2">Sin equipos todavía.</p>}
            </div>
          </Card>
        </div>

        {/* ¿QUIÉN JUEGA? */}
        <div className="flex items-center gap-2 mt-8 mb-3"><Users size={18} className="text-navy" /><h2 className="font-extrabold text-navy tracking-tight">¿Quién juega?</h2></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {db.kids.filter((k) => !k.user_id && k.active).map((k) => (
            <button key={k.id} onClick={() => onKid(k)} className="group bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition">
              <Avatar name={k.name} color={k.color} size={52} avatar={k.avatar} />
              <span className="font-bold text-sm mt-2 text-navy truncate w-full text-center">{k.name}</span>
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-0.5">Entrar <ChevronRight size={12} className="group-hover:translate-x-0.5 transition" /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-white"><span className="text-white/50">{icon}</span><span className="text-xl md:text-2xl font-extrabold tabular-nums">{value}</span></div>
      <div className="text-[10px] md:text-xs font-semibold text-white/50 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
