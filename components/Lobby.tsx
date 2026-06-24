"use client";
import { Card, Avatar, Bar, Chip, Btn } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import { levelOf } from "@/lib/game";
import type { Ctx, Kid } from "@/lib/types";
import { Trophy, Flag, LogIn, Sun } from "lucide-react";

export default function Lobby({ ctx, onKid, onLogin }: { ctx: Ctx; onKid: (k: Kid) => void; onLogin: () => void }) {
  const { db } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const teamScores = db.teams
    .map((t) => ({ ...t, pts: db.kids.filter((k) => k.team_id === t.id).reduce((s, k) => s + k.total_points, 0) }))
    .sort((a, b) => b.pts - a.pts);
  const tMax = teamScores[0]?.pts || 1;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="Gánate el Verano" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Casa Algar · Verano 2026</span>
          </div>
          <img src="/logo.png" alt="Gánate el Verano" className="h-28 md:h-36 w-auto object-contain mb-1" />
          <h1 className="sr-only">Gánate el Verano</h1>
          <p className="text-slate-400 font-medium mt-1">{pick(COPY.lobbyTitles)}</p>
        </div>
        <Btn variant="dark" className="flex items-center justify-center gap-2 md:px-6" onClick={onLogin}><LogIn size={18} /> Entrar / Crear cuenta</Btn>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4"><Trophy size={18} className="text-brand" /><h2 className="font-bold text-navy tracking-tight">Clasificación</h2></div>
          <div className="grid sm:grid-cols-2 sm:gap-x-8">
            {ranking.map((k, i) => (
              <div key={k.id} className="flex items-center gap-3 py-2">
                <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
                <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-sm"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-bold text-navy tabular-nums">{k.total_points}</span></div>
                  <div className="flex items-center gap-2 mt-1"><Chip tone="slate">Nv {levelOf(k.total_points)}</Chip><div className="flex-1"><Bar v={k.total_points} max={max} c={k.color} /></div></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Flag size={18} className="text-teal" /><h2 className="font-bold text-navy tracking-tight">Equipos</h2></div>
          {teamScores.map((t) => (
            <div key={t.id} className="py-2">
              <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-navy">{t.name}</span><span className="font-bold text-navy tabular-nums">{t.pts}</span></div>
              <Bar v={t.pts} max={tMax} c={t.color} />
            </div>
          ))}
        </Card>
      </div>

      <h2 className="font-bold text-navy tracking-tight mt-8 mb-3">¿Quién juega?</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {db.kids.map((k) => (
          <Card key={k.id} onClick={() => onKid(k)} className="p-4 flex flex-col items-center">
            <Avatar name={k.name} color={k.color} size={48} avatar={k.avatar} />
            <span className="font-semibold text-sm mt-2 text-navy truncate w-full text-center">{k.name}</span>
            <span className="text-xs text-slate-400 font-medium">Nivel {levelOf(k.total_points)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
