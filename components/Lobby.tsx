"use client";
import { Bar, Btn } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import type { Ctx, Kid } from "@/lib/types";

export default function Lobby({ ctx, onKid, onLogin }: { ctx: Ctx; onKid: (k: Kid) => void; onLogin: () => void }) {
  const { db } = ctx;
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const medals = ["🥇", "🥈", "🥉"];
  const teamScores = db.teams
    .map((t) => ({ ...t, pts: db.kids.filter((k) => k.team_id === t.id).reduce((s, k) => s + k.total_points, 0) }))
    .sort((a, b) => b.pts - a.pts);
  const tMax = teamScores[0]?.pts || 1;

  return (
    <div className="px-4 pt-7">
      <div className="text-center mb-5">
        <div className="text-5xl mb-1">☀️🏠</div>
        <h1 className="text-3xl font-black text-orange-600">Gánate el Verano</h1>
        <p className="text-slate-500 font-semibold text-sm mt-1">{pick(COPY.lobbyTitles)}</p>
      </div>

      <div className="bg-white rounded-3xl p-4 mb-4 shadow-sm">
        <h2 className="font-black text-lg mb-3">🏆 Ranking familiar</h2>
        {ranking.map((k, i) => (
          <div key={k.id} className="flex items-center gap-3 py-1.5">
            <span className="w-6 text-center font-black">{medals[i] || i + 1}</span>
            <span className="text-2xl">{k.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-bold"><span>{k.name}</span><span>{k.total_points} pts</span></div>
              <Bar v={k.total_points} max={max} c={k.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-4 mb-5 shadow-sm">
        <h2 className="font-black text-lg mb-3">⚔️ Equipos</h2>
        {teamScores.map((t) => (
          <div key={t.id} className="py-1.5">
            <div className="flex justify-between text-sm font-bold"><span>{t.emoji} {t.name}</span><span>{t.pts} pts</span></div>
            <Bar v={t.pts} max={tMax} c={t.color} />
          </div>
        ))}
      </div>

      <h2 className="font-black text-lg mb-2">¿Quién juega? 🎮</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {db.kids.map((k) => (
          <button key={k.id} onClick={() => onKid(k)} className="bg-white rounded-3xl p-3 flex flex-col items-center active:scale-95 transition shadow-sm">
            <span className="text-3xl">{k.emoji}</span>
            <span className="font-bold text-sm mt-1 truncate w-full text-center">{k.name}</span>
            <span className="text-xs font-bold" style={{ color: k.color }}>{k.total_points} pts</span>
          </button>
        ))}
      </div>

      <Btn c="bg-slate-800" className="w-full" onClick={onLogin}>👑 Soy Tamar / Ricardo</Btn>
    </div>
  );
}
