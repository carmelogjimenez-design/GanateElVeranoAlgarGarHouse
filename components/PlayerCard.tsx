"use client";
import { Avatar } from "@/components/ui/atoms";
import { levelOf, playerStats, rarityOf } from "@/lib/game";
import type { DB, Kid } from "@/lib/types";
import { Dumbbell, Brain, Flame } from "lucide-react";

export default function PlayerCard({ kid, db, size = "md" }: { kid: Kid; db: DB; size?: "sm" | "md" | "lg" }) {
  const s = playerStats(kid, db);
  const r = rarityOf(s.ovr);
  const lvl = levelOf(kid.total_points);
  const team = db.teams.find((t) => t.id === kid.team_id);
  const big = size === "lg";
  const av = big ? 92 : size === "md" ? 68 : 52;

  const stat = (Icon: typeof Flame, label: string, val: number) => (
    <div className="flex items-center justify-between" style={{ color: r.text }}>
      <span className="flex items-center gap-1.5 font-bold text-xs opacity-80"><Icon size={14} /> {label}</span>
      <span className="font-black tabular-nums" style={{ fontSize: big ? 18 : 15 }}>{val}</span>
    </div>
  );

  return (
    <div className={`gev-shine relative rounded-3xl ${big ? "p-5" : "p-4"}`} style={{ background: `linear-gradient(160deg,${r.grad[0]},${r.grad[1]})`, boxShadow: `0 18px 50px -12px ${r.grad[0]}99, inset 0 0 0 2px ${r.ring}` }}>
      <div className="relative flex items-start justify-between">
        <div className="text-center leading-none" style={{ color: r.text }}>
          <div className="font-black" style={{ fontSize: big ? 40 : 30 }}>{s.ovr}</div>
          <div className="font-bold uppercase tracking-wide opacity-80" style={{ fontSize: big ? 11 : 9 }}>OVR</div>
          <div className="mt-1 font-black uppercase tracking-wide" style={{ fontSize: big ? 11 : 9 }}>Nv {lvl}</div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,.18)", color: r.text }}>{r.label}</span>
      </div>

      <div className="flex justify-center my-2">
        <div className="rounded-full p-1" style={{ background: "rgba(255,255,255,.25)" }}><Avatar name={kid.name} color={kid.color} size={av} avatar={kid.avatar} /></div>
      </div>

      <div className="text-center" style={{ color: r.text }}>
        <div className="font-black truncate" style={{ fontSize: big ? 22 : 17 }}>{kid.name}</div>
        <div className="font-bold opacity-75 text-xs flex items-center justify-center gap-1.5">{team && <span className="w-2.5 h-2.5 rounded-full" style={{ background: team.color }} />}{team?.name || "Sin equipo"}</div>
      </div>

      <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${r.text}33` }}>
        {stat(Dumbbell, "FUERZA", s.fuerza)}
        {stat(Brain, "CEREBRO", s.cerebro)}
        {stat(Flame, "CONSTANCIA", s.constancia)}
      </div>
    </div>
  );
}
