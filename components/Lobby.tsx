"use client";
import { Card, Avatar, Bar, Chip, Btn } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { Trophy, Flag, ChevronRight, LogIn, Sun } from "lucide-react";

export default function Lobby({ ctx, onKid, onLogin }: { ctx: Ctx; onKid: (k: Kid) => void; onLogin: () => void }) {
  const { db } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const teamScores = db.teams
    .map((t) => ({ ...t, pts: db.kids.filter((k) => k.team_id === t.id).reduce((s, k) => s + k.total_points, 0) }))
    .sort((a, b) => b.pts - a.pts);
  const tMax = teamScores[0]?.pts || 1;

  return (
    <div className="px-4 pt-8 pb-8">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-xl bg-brand/12 flex items-center justify-center"><Sun size={20} className="text-brand" /></div>
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Casa Algar · Verano 2026</span>
      </div>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-navy">Gánate el Verano</h1>
      <p className="text-slate-400 font-medium text-sm mb-6">{pick(COPY.lobbyTitles)}</p>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3"><Trophy size={18} className="text-brand" /><h2 className="font-bold text-navy tracking-tight">Clasificación</h2></div>
        {ranking.map((k, i) => (
          <div key={k.id} className="flex items-center gap-3 py-2">
            <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
            <Avatar name={k.name} color={k.color} size={38} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-navy truncate">{k.name}</span>
                <span className="font-bold text-navy tabular-nums">{k.total_points} <span className="text-slate-400 font-medium">XP</span></span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Chip tone="slate">Nv {levelOf(k.total_points)}</Chip>
                <div className="flex-1"><Bar v={k.total_points} max={max} c={k.color} /></div>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-3"><Flag size={18} className="text-teal" /><h2 className="font-bold text-navy tracking-tight">Equipos</h2></div>
        {teamScores.map((t) => (
          <div key={t.id} className="py-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-navy">{t.name}</span>
              <span className="font-bold text-navy tabular-nums">{t.pts} <span className="text-slate-400 font-medium">XP</span></span>
            </div>
            <Bar v={t.pts} max={tMax} c={t.color} />
          </div>
        ))}
      </Card>

      <h2 className="font-bold text-navy tracking-tight mb-3 px-0.5">¿Quién juega?</h2>
      <div className="grid grid-cols-3 gap-3 mb-7">
        {db.kids.map((k) => (
          <Card key={k.id} onClick={() => onKid(k)} className="p-3 flex flex-col items-center">
            <Avatar name={k.name} color={k.color} size={46} />
            <span className="font-semibold text-sm mt-2 text-navy truncate w-full text-center">{k.name}</span>
            <span className="text-xs text-slate-400 font-medium">Nivel {levelOf(k.total_points)}</span>
          </Card>
        ))}
      </div>

      <Btn variant="dark" className="w-full flex items-center justify-center gap-2" onClick={onLogin}>
        <LogIn size={18} /> Entrar / Crear cuenta
      </Btn>
    </div>
  );
}
