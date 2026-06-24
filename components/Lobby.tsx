"use client";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/atoms";
import Footer from "@/components/Footer";
import { DAD_TAGLINES } from "@/lib/vibes";
import type { Ctx, Kid } from "@/lib/types";
import { Trophy, Flag, LogIn, Users, Sparkles, ChevronRight } from "lucide-react";

const MEDAL = ["#FACC15", "#CBD5E1", "#D8A36B"];
const PARTICLES = [
  { l: 8, t: 18, s: 6, d: 0 }, { l: 22, t: 60, s: 4, d: 1.2 }, { l: 38, t: 12, s: 5, d: 2.1 },
  { l: 54, t: 70, s: 7, d: 0.6 }, { l: 70, t: 22, s: 4, d: 1.8 }, { l: 84, t: 55, s: 6, d: 0.3 },
  { l: 92, t: 30, s: 5, d: 2.4 }, { l: 14, t: 80, s: 4, d: 1.5 }, { l: 46, t: 40, s: 3, d: 0.9 },
  { l: 64, t: 85, s: 5, d: 2.7 }, { l: 30, t: 32, s: 4, d: 1.1 }, { l: 78, t: 75, s: 6, d: 0.5 },
];

export default function Lobby({ ctx, onKid, onLogin }: { ctx: Ctx; onKid: (k: Kid) => void; onLogin: () => void }) {
  const { db } = ctx;
  const [tagIdx, setTagIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setTagIdx((i) => (i + 1) % DAD_TAGLINES.length), 3800); return () => clearInterval(t); }, []);

  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const top3 = ranking.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as Kid[];
  const podiumH = [104, 140, 76];
  const teamScores = db.teams.map((t) => ({ ...t, pts: db.kids.filter((k) => k.team_id === t.id).reduce((s, k) => s + k.total_points, 0) })).sort((a, b) => b.pts - a.pts);
  const tMax = teamScores[0]?.pts || 1;
  const totalXp = db.kids.reduce((s, k) => s + Math.max(0, k.total_points), 0);
  const players = db.kids.filter((k) => k.active).length;

  return (
    <div className="min-h-screen" style={{ background: "#0A1A30" }}>
      <style>{`
        @keyframes gevFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes gevAurora{0%{transform:translate(0,0) scale(1)}50%{transform:translate(24px,-14px) scale(1.12)}100%{transform:translate(0,0) scale(1)}}
        @keyframes gevPulse{0%,100%{box-shadow:0 10px 40px -6px rgba(255,138,0,.55)}50%{box-shadow:0 14px 60px 2px rgba(255,138,0,.8)}}
        @keyframes gevFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gevShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        @keyframes gevTwinkle{0%,100%{opacity:.15;transform:scale(.8)}50%{opacity:.85;transform:scale(1.15)}}
        @keyframes gevTagIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .gev-up{animation:gevFadeUp .7s cubic-bezier(.2,.7,.2,1) both}
        .gev-glow-text{background:linear-gradient(90deg,#FF8A00,#FFD166,#19D3AE,#FF8A00);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gevShimmer 6s linear infinite}
      `}</style>

      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% -10%,#1B3A66 0%,#0E2342 45%,#0A1A30 100%)" }} />
        <div className="absolute -top-24 right-[-10%] w-[460px] h-[460px] rounded-full blur-[90px] opacity-50" style={{ background: "radial-gradient(circle,#FF8A00,transparent 70%)", animation: "gevAurora 14s ease-in-out infinite" }} />
        <div className="absolute bottom-[-12%] left-[-12%] w-[480px] h-[480px] rounded-full blur-[100px] opacity-45" style={{ background: "radial-gradient(circle,#19D3AE,transparent 70%)", animation: "gevAurora 18s ease-in-out infinite reverse" }} />
        <div className="absolute top-[20%] left-[40%] w-[360px] h-[360px] rounded-full blur-[90px] opacity-25" style={{ background: "radial-gradient(circle,#EAB308,transparent 70%)", animation: "gevAurora 16s ease-in-out infinite" }} />
        {PARTICLES.map((p, i) => (
          <span key={i} className="absolute rounded-full bg-white" style={{ left: `${p.l}%`, top: `${p.t}%`, width: p.s, height: p.s, animation: `gevTwinkle ${3 + p.d}s ease-in-out ${p.d}s infinite` }} />
        ))}

        <div className="relative max-w-4xl mx-auto px-5 pt-10 pb-16 text-center">
          <span className="gev-up inline-block text-[11px] font-bold tracking-[0.25em] uppercase text-white/55 border border-white/15 bg-white/5 rounded-full px-4 py-1.5 mb-6">Casa Algar · Verano 2026</span>

          <div className="gev-up" style={{ animationDelay: ".08s" }}>
            <img src="/logo.png" alt="Gánate el Verano" className="h-40 md:h-48 w-auto object-contain mx-auto" style={{ filter: "drop-shadow(0 12px 40px rgba(255,138,0,.35))", animation: "gevFloat 6s ease-in-out infinite" }} />
          </div>

          <h1 className="gev-up mt-5 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight" style={{ animationDelay: ".16s" }}>
            <span className="text-white">BIENVENIDO AL </span>
            <span className="gev-glow-text">VIDEOJUEGO DEL VERANO</span>
          </h1>

          <div className="gev-up h-12 mt-4 flex items-center justify-center" style={{ animationDelay: ".24s" }}>
            <p key={tagIdx} className="text-white/70 font-semibold text-base md:text-lg max-w-xl" style={{ animation: "gevTagIn .5s ease both" }}>“{DAD_TAGLINES[tagIdx]}”</p>
          </div>

          <button onClick={onLogin} className="gev-up mt-7 inline-flex items-center gap-2.5 bg-gradient-to-r from-brand to-amber-500 text-white font-extrabold text-lg rounded-2xl px-9 py-4 active:scale-95 transition" style={{ animation: "gevPulse 2.6s ease-in-out infinite" }}>
            <LogIn size={20} /> Entrar al juego
          </button>

          <div className="gev-up flex items-center justify-center gap-4 md:gap-7 mt-9" style={{ animationDelay: ".4s" }}>
            <Stat icon={<Users size={15} />} value={players} label="jugadores" />
            <span className="w-px h-9 bg-white/10" />
            <Stat icon={<Flag size={15} />} value={db.teams.length} label="equipos" />
            <span className="w-px h-9 bg-white/10" />
            <Stat icon={<Sparkles size={15} />} value={totalXp} label="XP en juego" />
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-16 pt-2">
        {top3.length >= 2 && (
          <GlassCard className="p-6 mb-5">
            <Head icon={<Trophy size={18} className="text-amber-400" />}>Podio</Head>
            <div className="flex items-end justify-center gap-3 md:gap-7 mt-2">
              {order.map((k) => {
                const place = ranking.indexOf(k);
                return (
                  <div key={k.id} className="flex flex-col items-center flex-1 max-w-[150px]">
                    {place === 0 && <div className="text-2xl mb-1" style={{ animation: "gevFloat 4s ease-in-out infinite" }}>👑</div>}
                    <div style={{ filter: place === 0 ? "drop-shadow(0 0 16px rgba(250,204,21,.6))" : "none" }}><Avatar name={k.name} color={k.color} size={place === 0 ? 66 : 54} avatar={k.avatar} /></div>
                    <div className="font-bold text-white text-sm mt-2 truncate w-full text-center">{k.name}</div>
                    <div className="text-xs font-semibold text-white/45">{k.total_points} XP</div>
                    <div className="w-full rounded-t-2xl mt-2 flex items-start justify-center pt-2 font-black text-white/90 text-xl" style={{ height: podiumH[place], background: `linear-gradient(180deg,${MEDAL[place]}cc,${MEDAL[place]}22)`, boxShadow: `inset 0 1px 0 ${MEDAL[place]}` }}>{place + 1}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <GlassCard className="p-5 md:col-span-2">
            <Head icon={<Trophy size={18} className="text-brand" />}>Clasificación</Head>
            <div className="grid sm:grid-cols-2 sm:gap-x-8 mt-1">
              {ranking.map((k, i) => (
                <div key={k.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: i < 3 ? MEDAL[i] : "rgba(255,255,255,.08)", color: i < 3 ? "#0A1A30" : "rgba(255,255,255,.4)" }}>{i + 1}</span>
                  <Avatar name={k.name} color={k.color} size={34} avatar={k.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-sm"><span className="font-semibold text-white truncate">{k.name}</span><span className="font-black text-white tabular-nums">{k.total_points}</span></div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(4, (Math.max(0, k.total_points) / max) * 100)}%`, background: k.color }} /></div>
                  </div>
                </div>
              ))}
              {ranking.length === 0 && <p className="text-white/40 text-sm font-medium py-4">Aún no hay jugadores.</p>}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Head icon={<Flag size={18} className="text-teal" />}>Equipos</Head>
            <div className="space-y-2.5 mt-1">
              {teamScores.map((t, i) => (
                <div key={t.id} className="rounded-2xl p-3" style={{ background: i === 0 ? "rgba(255,138,0,.12)" : "rgba(255,255,255,.04)", border: i === 0 ? "1px solid rgba(255,138,0,.25)" : "1px solid rgba(255,255,255,.06)" }}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-bold text-white flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.name}</span>
                    <span className="font-black text-white tabular-nums">{t.pts}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(4, (Math.max(0, t.pts) / tMax) * 100)}%`, background: t.color }} /></div>
                </div>
              ))}
              {teamScores.length === 0 && <p className="text-white/40 text-sm font-medium py-2">Sin equipos todavía.</p>}
            </div>
          </GlassCard>
        </div>

        <div className="flex items-center gap-2 mt-9 mb-3"><Users size={18} className="text-white/70" /><h2 className="font-black text-white tracking-tight text-lg">¿Quién juega?</h2></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {db.kids.filter((k) => !k.user_id && k.active).map((k) => (
            <button key={k.id} onClick={() => onKid(k)} className="group rounded-2xl p-4 flex flex-col items-center transition active:scale-95" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
              <div className="group-hover:scale-110 transition" style={{ filter: `drop-shadow(0 0 12px ${k.color}66)` }}><Avatar name={k.name} color={k.color} size={50} avatar={k.avatar} /></div>
              <span className="font-bold text-sm mt-2 text-white truncate w-full text-center">{k.name}</span>
              <span className="text-[11px] text-white/45 font-semibold flex items-center gap-0.5">Entrar <ChevronRight size={12} className="group-hover:translate-x-0.5 transition" /></span>
            </button>
          ))}
        </div>
      </div>
      <Footer dark />
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl ${className}`} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(8px)" }}>{children}</div>;
}
function Head({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2"><span>{icon}</span><h2 className="font-black text-white tracking-tight text-lg">{children}</h2></div>;
}
function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-white"><span className="text-white/45">{icon}</span><span className="text-xl md:text-2xl font-black tabular-nums">{value}</span></div>
      <div className="text-[10px] md:text-xs font-bold text-white/45 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
