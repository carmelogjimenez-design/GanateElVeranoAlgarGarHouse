"use client";
import { useState } from "react";
import { Card, Avatar, Bar, Chip } from "@/components/ui/atoms";
import { levelOf } from "@/lib/game";
import type { DB } from "@/lib/types";
import { Trophy } from "lucide-react";

const TABS = [["general", "General"], ["semana", "Semana"], ["mes", "Mes"], ["equipos", "Equipos"]] as const;

export default function RankingList({ db, highlight }: { db: DB; highlight?: string }) {
  const [tab, setTab] = useState<string>("general");
  const inLast = (d: string, days: number) => Date.now() - new Date(d).getTime() < days * 864e5;
  const periodXp = (kidId: string, days: number) => db.point_events.filter((e) => e.kid_id === kidId && e.delta > 0 && inLast(e.created_at, days)).reduce((a, b) => a + b.delta, 0);
  const valueOf = (kidId: string, total: number) => tab === "semana" ? periodXp(kidId, 7) : tab === "mes" ? periodXp(kidId, 30) : total;

  const kidRows = [...db.kids].map((k) => ({ k, v: valueOf(k.id, k.total_points) })).sort((a, b) => b.v - a.v);
  const teamRows = db.teams.map((t) => { const ms = db.kids.filter((k) => k.team_id === t.id); return { t, members: ms.length, v: ms.reduce((s, k) => s + (tab === "equipos" ? k.total_points : valueOf(k.id, k.total_points)), 0) }; }).sort((a, b) => b.v - a.v);
  const kidMax = kidRows[0]?.v || 1;
  const teamMax = teamRows[0]?.v || 1;
  const medal = ["#FACC15", "#CBD5E1", "#D8A36B"];

  return (
    <div className="pb-6">
      <h3 className="font-bold text-navy tracking-tight px-0.5 mb-3 flex items-center gap-2"><Trophy size={18} className="text-brand" /> Clasificación</h3>
      <div className="flex gap-1.5 mb-3 bg-slate-100 p-1 rounded-2xl">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 text-sm font-semibold py-2 rounded-xl transition ${tab === k ? "bg-white text-navy shadow-sm" : "text-slate-400"}`}>{label}</button>
        ))}
      </div>

      <Card className="p-4">
        {tab === "equipos" ? (
          teamRows.map((t, i) => (
            <div key={t.t.id} className="flex items-center gap-3 py-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-white text-xs" style={{ background: i < 3 ? medal[i] : "#CBD5E1" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm"><span className="font-semibold text-navy flex items-center gap-2 truncate"><span className="w-3 h-3 rounded-full" style={{ background: t.t.color }} />{t.t.name} <span className="text-slate-400 font-medium">· {t.members}</span></span><span className="font-bold text-navy tabular-nums">{t.v} XP</span></div>
                <div className="mt-1"><Bar v={t.v} max={teamMax} c={t.t.color} /></div>
              </div>
            </div>
          ))
        ) : (
          kidRows.map((r, i) => (
            <div key={r.k.id} className={`flex items-center gap-3 py-2 ${r.k.id === highlight ? "-mx-2 px-2 bg-orange-50 rounded-xl" : ""}`}>
              <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
              <Avatar name={r.k.name} color={r.k.color} size={36} avatar={r.k.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm"><span className="font-semibold text-navy truncate">{r.k.name}</span><span className="font-bold text-navy tabular-nums">{r.v} XP</span></div>
                <div className="flex items-center gap-2 mt-1"><Chip tone="slate">Nv {levelOf(r.k.total_points)}</Chip><div className="flex-1"><Bar v={r.v} max={kidMax} c={r.k.color} /></div></div>
              </div>
            </div>
          ))
        )}
        {((tab === "equipos" && teamRows.length === 0) || (tab !== "equipos" && kidRows.length === 0)) && <p className="text-slate-400 text-sm font-medium text-center py-4">Sin datos todavía.</p>}
      </Card>
      {tab !== "general" && tab !== "equipos" && <p className="text-xs text-slate-400 font-medium mt-2 px-1">XP ganada en {tab === "semana" ? "los últimos 7 días" : "los últimos 30 días"}.</p>}
    </div>
  );
}
