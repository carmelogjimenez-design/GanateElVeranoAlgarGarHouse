"use client";
import { Avatar } from "@/components/ui/atoms";
import { levelOf, playerStats, rarityOf } from "@/lib/game";
import type { DB, Kid } from "@/lib/types";
import { Dumbbell, Brain, Flame } from "lucide-react";

const FRAME: Record<string, { base: string; hi: string; panel: string; text: string; sub: string; ring: string; holo?: boolean }> = {
  comun: { base: "linear-gradient(165deg,#CC9156 0%,#A66C36 45%,#6E4A24 100%)", hi: "rgba(255,220,170,.55)", panel: "rgba(35,20,6,.40)", text: "#FFF4E6", sub: "rgba(255,244,230,.7)", ring: "#F2CFA0" },
  raro: { base: "linear-gradient(165deg,#C2CCD8 0%,#94A1AE 45%,#5E6B78 100%)", hi: "rgba(255,255,255,.6)", panel: "rgba(18,26,36,.42)", text: "#FFFFFF", sub: "rgba(255,255,255,.78)", ring: "#EAF1F8" },
  epico: { base: "linear-gradient(165deg,#F4CE62 0%,#D7A82F 45%,#9A7616 100%)", hi: "rgba(255,247,210,.7)", panel: "rgba(40,28,0,.40)", text: "#FFFBEC", sub: "rgba(255,251,236,.8)", ring: "#FCE9A6" },
  legendario: { base: "linear-gradient(165deg,#8B5CF6 0%,#6D28D9 40%,#0E9F8E 100%)", hi: "rgba(233,213,255,.7)", panel: "rgba(8,6,28,.46)", text: "#FFFFFF", sub: "rgba(233,221,255,.82)", ring: "#C9B6FF", holo: true },
};

export default function PlayerCard({ kid, db, size = "md" }: { kid: Kid; db: DB; size?: "sm" | "md" | "lg" }) {
  const s = playerStats(kid, db);
  const r = rarityOf(s.ovr);
  const f = FRAME[r.key] || FRAME.comun;
  const lvl = levelOf(kid.total_points);
  const team = db.teams.find((t) => t.id === kid.team_id);
  const big = size === "lg";
  const av = big ? 104 : size === "md" ? 90 : 84;

  const stat = (Icon: typeof Flame, label: string, val: number) => (
    <div className="flex items-center gap-2.5">
      <Icon size={15} style={{ color: f.text, opacity: 0.85 }} />
      <span className="font-bold text-[11px] tracking-wide uppercase" style={{ color: f.sub, width: 78 }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.18)" }}>
        <div className="h-full rounded-full" style={{ width: `${val}%`, background: f.text }} />
      </div>
      <span className="font-black tabular-nums text-right" style={{ color: f.text, width: 26, fontSize: big ? 17 : 15 }}>{val}</span>
    </div>
  );

  return (
    <div className="gev-shine relative rounded-[26px] overflow-hidden mx-auto" style={{ width: big ? 300 : 248, background: f.base, boxShadow: `0 24px 60px -16px ${f.ring}66, inset 0 0 0 2px ${f.ring}, inset 0 0 60px rgba(255,255,255,.12)` }}>
      {/* brillo superior */}
      <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: `radial-gradient(120% 90% at 50% -20%, ${f.hi}, transparent 70%)` }} />
      {f.holo && <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(115deg,transparent 30%,rgba(255,0,200,.25),rgba(0,255,200,.25),transparent 70%)" }} />}

      <div className="relative p-5">
        {/* fila superior */}
        <div className="flex items-start justify-between">
          <div className="leading-none" style={{ color: f.text }}>
            <div className="font-black" style={{ fontSize: big ? 42 : 36 }}>{s.ovr}</div>
            <div className="font-bold uppercase tracking-[.2em] opacity-75" style={{ fontSize: 10 }}>OVR</div>
            <div className="mt-1.5 font-black uppercase tracking-wide" style={{ fontSize: 11 }}>Nv {lvl}</div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,.22)", color: f.text, boxShadow: `inset 0 0 0 1px ${f.ring}55` }}>{r.label}</span>
        </div>

        {/* avatar con aro */}
        <div className="flex justify-center mt-1 mb-3">
          <div className="rounded-full p-[3px]" style={{ background: `conic-gradient(${f.ring},#ffffffaa,${f.ring})`, boxShadow: `0 0 24px ${f.ring}aa` }}>
            <div className="rounded-full p-1" style={{ background: f.base }}>
              <Avatar name={kid.name} color={kid.color} size={av} avatar={kid.avatar} />
            </div>
          </div>
        </div>

        {/* nombre */}
        <div className="text-center" style={{ color: f.text }}>
          <div className="font-black truncate" style={{ fontSize: big ? 24 : 20, textShadow: "0 1px 8px rgba(0,0,0,.25)" }}>{kid.name}</div>
          <div className="font-bold text-xs flex items-center justify-center gap-1.5 mt-0.5" style={{ color: f.sub }}>{team && <span className="w-2.5 h-2.5 rounded-full" style={{ background: team.color }} />}{team?.name || "Sin equipo"}</div>
        </div>

        {/* panel de stats */}
        <div className="mt-4 rounded-2xl p-3.5 space-y-2.5" style={{ background: f.panel, boxShadow: `inset 0 0 0 1px ${f.ring}33` }}>
          {stat(Dumbbell, "Fuerza", s.fuerza)}
          {stat(Brain, "Cerebro", s.cerebro)}
          {stat(Flame, "Constancia", s.constancia)}
        </div>
      </div>
    </div>
  );
}
