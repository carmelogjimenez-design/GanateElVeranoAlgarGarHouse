"use client";
import { levelOf, playerStats, rarityOf, initials } from "@/lib/game";
import { avatarIcon } from "@/lib/icons";
import type { DB, Kid } from "@/lib/types";
import { Dumbbell, Brain, Flame, ChevronRight } from "lucide-react";

export default function CarnetCard({ kid, db, onClick }: { kid: Kid; db: DB; onClick?: () => void }) {
  const s = playerStats(kid, db);
  const r = rarityOf(s.ovr);
  const lvl = levelOf(kid.total_points);
  const team = db.teams.find((t) => t.id === kid.team_id);
  const photo = kid.avatar && kid.avatar.startsWith("http") ? kid.avatar : null;
  const Ic = !photo && kid.avatar ? avatarIcon(kid.avatar) : null;

  const mini = (Icon: typeof Flame, val: number) => (
    <span className="flex items-center gap-1 text-[11px] font-bold text-navy/55"><Icon size={12} />{val}</span>
  );

  return (
    <button onClick={onClick} className="gev-card gev-sheen w-full p-3 flex items-center gap-3.5 text-left active:scale-[.98] transition">
      <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: `linear-gradient(${r.grad[0]},${r.grad[1]})` }} />
      <div className="rounded-full p-[2.5px] shrink-0" style={{ background: `linear-gradient(150deg,#fff,${r.grad[0]})`, boxShadow: `0 4px 12px ${r.grad[0]}55` }}>
        <div className="relative rounded-full overflow-hidden flex items-center justify-center" style={{ width: 58, height: 58, background: "radial-gradient(circle at 50% 32%, rgba(255,255,255,.5), rgba(0,0,0,.12))" }}>
          {photo ? <img src={photo} alt={kid.name} className="absolute inset-0 w-full h-full object-cover" /> : (
            <>
              <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 50% 42%, ${kid.color}, transparent 64%)`, opacity: 0.6 }} />
              {Ic ? <Ic size={26} className="relative text-white" /> : <span className="relative font-black text-white text-xl">{initials(kid.name)}</span>}
            </>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-navy text-[17px] truncate">{kid.name}</span>
          <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md text-white" style={{ background: r.grad[0] }}>{r.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-navy/50 font-semibold mt-0.5">
          {team && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: team.color }} />{team.name}</span>}
          <span>· Nv {lvl}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">{mini(Dumbbell, s.fuerza)}{mini(Brain, s.cerebro)}{mini(Flame, s.constancia)}</div>
      </div>
      <div className="text-center shrink-0 pr-1">
        <div className="font-black text-navy leading-none" style={{ fontSize: 30 }}>{s.ovr}</div>
        <div className="text-[9px] font-bold tracking-widest text-navy/40">OVR</div>
        <ChevronRight size={16} className="text-navy/30 mx-auto mt-1" />
      </div>
    </button>
  );
}
