"use client";
import { useState } from "react";
import { Card, Avatar, Bar, Chip } from "@/components/ui/atoms";
import { levelOf } from "@/lib/game";
import type { DB } from "@/lib/types";
import { Trophy, Crown, Flame } from "lucide-react";

const TABS = [["general", "General"], ["semana", "Semana"], ["mes", "Mes"]] as const;

export default function RankingList({ db, highlight }: { db: DB; highlight?: string }) {
  const [tab, setTab] = useState<string>("general");
  const inLast = (d: string, days: number) => Date.now() - new Date(d).getTime() < days * 864e5;
  const periodXp = (kidId: string, days: number) => db.point_events.filter((e) => e.kid_id === kidId && e.delta > 0 && inLast(e.created_at, days)).reduce((a, b) => a + b.delta, 0);
  const valueOf = (kidId: string, total: number) => (tab === "semana" ? periodXp(kidId, 7) : tab === "mes" ? periodXp(kidId, 30) : total);

  const kidRows = [...db.kids].map((k) => ({ k, v: valueOf(k.id, k.total_points) })).sort((a, b) => b.v - a.v);
  const kidMax = kidRows[0]?.v || 1;

  // ── Equipos (por puntos totales = el pique de verdad) ──
  const teamRows = db.teams.map((t) => {
    const ms = db.kids.filter((k) => k.team_id === t.id);
    return { t, members: ms.length, v: ms.reduce((s, k) => s + k.total_points, 0) };
  }).sort((a, b) => b.v - a.v);
  const teamMax = teamRows[0]?.v || 1;
  const medal = ["#FACC15", "#CBD5E1", "#D8A36B"];

  const myKid = db.kids.find((k) => k.id === highlight);
  const myTeamId = myKid?.team_id;
  const myRank = teamRows.findIndex((t) => t.t.id === myTeamId);
  const myRow = myRank >= 0 ? teamRows[myRank] : null;
  const ahead = myRank > 0 ? teamRows[myRank - 1] : null;
  const gapUp = ahead && myRow ? ahead.v - myRow.v : 0;
  const lead = myRank === 0 && teamRows[1] && myRow ? myRow.v - teamRows[1].v : 0;

  // Líder del ranking que se está viendo (premio "hijo de la semana" = +3 XP)
  const myIdx = kidRows.findIndex((r) => r.k.id === highlight);
  const iLead = !!kidRows[0] && kidRows[0].k.id === highlight && kidRows[0].v > 0;
  const gap = myIdx > 0 ? kidRows[myIdx - 1].v - kidRows[myIdx].v : 0;
  const kAhead = myIdx > 0 ? kidRows[myIdx - 1].k : null;
  const periodTxt = tab === "semana" ? "de la semana" : tab === "mes" ? "del mes" : "";

  return (
    <div className="pb-6">
      {/* ===== PIQUE DE EQUIPOS ===== */}
      <div className="flex items-center justify-between px-0.5 mb-2 gap-2">
        <h3 className="font-black text-navy tracking-tight flex items-center gap-2 text-lg"><Flame size={20} style={{ color: "#FF6B5E" }} /> Pique de equipos</h3>
        <span className="text-[11px] font-bold px-2 py-1 rounded-lg shrink-0" style={{ background: "#FACC151f", color: "#B45309" }}>🏆 +5 XP al equipo del mes</span>
      </div>

      {myRow && (
        <div className="rounded-2xl p-4 mb-3 text-white relative overflow-hidden" style={{ background: myRank === 0 ? "linear-gradient(135deg,#FF9F45,#FF6B5E)" : "linear-gradient(135deg,#0B1F3A,#15315c)" }}>
          <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.14)", filter: "blur(6px)" }} />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl" style={{ background: "rgba(255,255,255,.18)" }}>
              {myRank === 0 ? <Crown size={24} /> : `${myRank + 1}º`}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold tracking-[.14em] uppercase text-white/60">Tu equipo</div>
              <div className="text-xl font-black tracking-tight truncate flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: myRow.t.color }} />{myRow.t.name}</div>
              <div className="text-[13px] font-semibold text-white/85 mt-0.5">
                {myRank === 0
                  ? (teamRows.length > 1 ? `👑 ¡Vais LÍDERES! Si acabáis el mes así, cada uno gana +5 XP 🏆` : "👑 ¡Vais líderes! El equipo del mes gana +5 XP cada uno 🏆")
                  : <>Vais {myRank + 1}º · a <b className="text-white">{gapUp} pts</b> del {myRank}º ({ahead?.t.name}) 🔥 ¡A por ellos!</>}
              </div>
            </div>
            <div className="text-right shrink-0"><div className="text-2xl font-black tabular-nums">{myRow.v}</div><div className="text-[10px] text-white/60 font-semibold">PUNTOS</div></div>
          </div>
        </div>
      )}

      <Card className="p-4 mb-5">
        <div className="space-y-2.5">
          {teamRows.map((t, i) => {
            const mine = t.t.id === myTeamId;
            return (
              <div key={t.t.id} className="flex items-center gap-3 rounded-2xl p-2.5" style={mine ? { background: "#FF6B5E0d", border: "1px solid #FF6B5E33" } : i === 0 ? { background: "linear-gradient(90deg,rgba(250,204,21,.14),rgba(250,204,21,.02))" } : {}}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0" style={{ background: i < 3 ? medal[i] : "#94A3B8" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-bold text-navy flex items-center gap-2 truncate"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.t.color }} />{t.t.name}{mine && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "#FF6B5E1a", color: "#E05546" }}>tú</span>}<span className="text-slate-400 font-medium">· {t.members}</span></span>
                    <span className="font-black text-navy tabular-nums">{t.v}</span>
                  </div>
                  <Bar v={t.v} max={teamMax} c={t.t.color} />
                </div>
              </div>
            );
          })}
          {teamRows.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Aún no hay equipos.</p>}
        </div>
      </Card>

      {/* ===== INDIVIDUAL ===== */}
      <div className="flex items-center justify-between px-0.5 mb-2 gap-2">
        <h3 className="font-bold text-navy tracking-tight flex items-center gap-2"><Trophy size={18} className="text-brand" /> Ranking individual</h3>
        <span className="text-[11px] font-bold px-2 py-1 rounded-lg shrink-0" style={{ background: "#A855F71f", color: "#7c3aed" }}>🌟 +3 XP al líder de la semana</span>
      </div>

      {iLead ? (
        <div className="rounded-2xl p-3.5 mb-3 text-white" style={{ background: "linear-gradient(135deg,#FF9F45,#A855F7)", boxShadow: "0 14px 34px -18px rgba(168,85,247,.65)" }}>
          <div className="flex items-center gap-3">
            <div className="text-[26px] leading-none">🌟</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[15px]">{tab === "semana" ? "¡Vas líder de la semana!" : "¡Vas primero! 👑"}</div>
              <div className="text-[12px] text-white/85 font-medium">{tab === "semana" ? <>Si acabas 1º el domingo, te llevas <b className="text-white">+3 XP</b> de premio. ¡No te despistes! 😏</> : <>El líder de la semana gana <b className="text-white">+3 XP</b>. ¡Sigue así y serás tú! 😏</>}</div>
            </div>
          </div>
        </div>
      ) : myIdx > 0 && kAhead ? (
        <div className="rounded-2xl p-3 mb-3" style={{ background: "#A855F70d", border: "1px solid #A855F722" }}>
          <div className="text-[13px] font-semibold text-navy">Vas a <b style={{ color: "#7c3aed" }}>{gap} pts</b> del líder {periodTxt} ({kAhead.name}) 🔥</div>
          <div className="text-[12px] text-slate-500 font-medium">Adelántale y pelea por los <b>+3 XP</b> del líder de la semana.</div>
        </div>
      ) : null}

      <div className="flex gap-1.5 mb-3 bg-slate-100 p-1 rounded-2xl">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 text-sm font-semibold py-2 rounded-xl transition ${tab === k ? "bg-white text-navy shadow-sm" : "text-slate-400"}`}>{label}</button>
        ))}
      </div>

      <Card className="p-4">
        {kidRows.map((r, i) => (
          <div key={r.k.id} className={`flex items-center gap-3 py-2 ${r.k.id === highlight ? "-mx-2 px-2 bg-orange-50 rounded-xl" : ""}`}>
            <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
            <Avatar name={r.k.name} color={r.k.color} size={36} avatar={r.k.avatar} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm"><span className="font-semibold text-navy truncate">{r.k.name}</span><span className="font-bold text-navy tabular-nums">{r.v} XP</span></div>
              <div className="flex items-center gap-2 mt-1"><Chip tone="slate">Nv {levelOf(r.k.total_points)}</Chip><div className="flex-1"><Bar v={r.v} max={kidMax} c={r.k.color} /></div></div>
            </div>
          </div>
        ))}
        {kidRows.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-4">Sin datos todavía.</p>}
      </Card>
      {tab !== "general" && <p className="text-xs text-slate-400 font-medium mt-2 px-1">XP ganada en {tab === "semana" ? "los últimos 7 días" : "los últimos 30 días"}.</p>}
    </div>
  );
}
