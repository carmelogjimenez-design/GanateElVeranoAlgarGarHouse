"use client";
import { useState } from "react";
import { Card, Ring, Bar, IconTile, Chip, Btn, Modal } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import {
  levelOf, levelProgress, xpToNext, nearestReward,
  weeklyXp, weekdayBars, studyTodaySeconds, teamWeeklyXp, streakDays,
} from "@/lib/game";
import { missionIcon, badgeIcon } from "@/lib/icons";
import { COPY, pick } from "@/lib/copy";
import type { Ctx, Kid } from "@/lib/types";
import {
  Flame, Clock, Trophy, ArrowRight, Check, Target, Award, Brain, Sparkles,
  Crown, Timer, Medal, Star, Gift, ArrowLeftRight, Zap,
} from "lucide-react";

export default function KidHome({ ctx, me, onTab, onMercado }:
  { ctx: Ctx; me: Kid; onTab: (t: string) => void; onMercado: () => void }) {
  const { db, flash, refresh, kid } = ctx;
  const [showBadges, setShowBadges] = useState(false);
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const rank = ranking.findIndex((k) => k.id === me.id) + 1;
  const team = db.teams.find((t) => t.id === me.team_id);
  const teamKids = db.kids.filter((k) => k.team_id === me.team_id);
  const teamPts = teamKids.reduce((s, k) => s + k.total_points, 0);
  const teamRanking = db.teams.map((t) => ({ id: t.id, pts: db.kids.filter((k) => k.team_id === t.id).reduce((s, k) => s + k.total_points, 0) })).sort((a, b) => b.pts - a.pts);
  const teamRank = team ? teamRanking.findIndex((t) => t.id === team.id) + 1 : 0;

  const myAsg = db.assignments.filter((a) => a.kid_id === me.id);
  const todo = myAsg.filter((a) => ["todo", "rejected"].includes(a.status));
  const streak = streakDays(myAsg);
  const wXp = weeklyXp(db.point_events, me.id);
  const bars = weekdayBars(db.point_events, me.id);
  const barMax = Math.max(...bars, 1);
  const studyH = (studyTodaySeconds(db.study_sessions, me.id) / 3600).toFixed(1);
  const tWeek = teamWeeklyXp(db.point_events, teamKids.map((k) => k.id));
  const goal = me.weekly_goal || 100;
  const teamGoal = db.settings?.team_goal || 200;
  const challengeLabel = db.settings?.challenge_label || "Reto de equipo";
  const until = db.settings?.challenge_until;
  const daysLeft = until ? Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 864e5)) : 7 - ((new Date().getDay() + 6) % 7);
  const next = nearestReward(me, db.rewards);
  const NextIcon = next ? missionIcon(next.title) : Gift;
  const incoming = db.gifts.find((g) => g.to_kid === me.id && g.status === "pending");

  const mark = async (id: string) => {
    const { error } = await rpc("mark_done", { p_assignment: id, p_kid: me.id, p_pin: kid!.pin });
    if (error) flash(error.message); else { flash(pick(COPY.done)); refresh(); }
  };

  const lvl = levelOf(me.total_points);
  const earned = new Set(db.kid_badges.filter((b) => b.kid_id === me.id).map((b) => b.badge_code));
  const catalog = [...db.badges_catalog].sort((a, b) => a.sort - b.sort);

  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const weekdayName = ["L", "M", "X", "J", "V", "S", "D"][(new Date().getDay() + 6) % 7];

  return (
    <div className="space-y-5">
      {/* HERO GRID */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Nivel actual */}
        <Card className="bg-navy border-navy text-white p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-50">Nivel actual</div>
          <div className="font-bold mt-0.5">{lvl} · {team?.name || "Sin equipo"}</div>
          <div className="flex items-center gap-4 mt-3">
            <Ring value={levelProgress(me.total_points)} size={96} stroke={9} color={me.color}>
              <span className="text-2xl font-extrabold">{lvl}</span>
            </Ring>
            <div className="flex-1">
              <div className="text-2xl font-extrabold leading-none">{Math.round(levelProgress(me.total_points) * 100)}%</div>
              <div className="text-xs opacity-60 mb-2">para nivel {lvl + 1}</div>
              <Bar v={me.total_points % 100} max={100} c={me.color} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
            <div><div className="flex items-center justify-center gap-1 text-brand"><Flame size={14} /><span className="font-bold">{streak}</span></div><div className="text-[10px] opacity-50 mt-0.5">RACHA</div></div>
            <div><div className="flex items-center justify-center gap-1 text-teal"><Clock size={14} /><span className="font-bold">{studyH}h</span></div><div className="text-[10px] opacity-50 mt-0.5">ESTUDIO HOY</div></div>
            <div><div className="flex items-center justify-center gap-1"><Trophy size={14} className="text-yellow-400" /><span className="font-bold">#{rank}</span></div><div className="text-[10px] opacity-50 mt-0.5">RANKING</div></div>
          </div>
        </Card>

        {/* Tu equipo */}
        <Card className="text-white p-5 border-0" style={{ background: team?.color || "#19D3AE" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Tu equipo</div>
          <div className="text-2xl font-extrabold tracking-tight mt-0.5">{team?.name || "Sin equipo"}</div>
          <div className="bg-white/15 rounded-2xl p-3 mt-4 flex">
            <div className="flex-1 text-center"><div className="text-xl font-extrabold">#{teamRank || "-"}</div><div className="text-[10px] opacity-80">DE {db.teams.length} EQUIPOS</div></div>
            <div className="w-px bg-white/20" />
            <div className="flex-1 text-center"><div className="text-xl font-extrabold">{teamPts}</div><div className="text-[10px] opacity-80">PUNTOS</div></div>
          </div>
          <button onClick={() => onTab("ranking")} className="w-full mt-4 bg-white/20 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2">Ver ranking de equipos <ArrowRight size={15} /></button>
        </Card>

        {/* Objetivo semanal */}
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Objetivo semanal</div>
          <div className="mt-1"><span className="text-3xl font-extrabold text-navy">{wXp}</span><span className="text-slate-400 font-semibold">/{goal} pts</span></div>
          <div className="mt-3"><Bar v={wXp} max={goal} /></div>
          <div className="text-sm font-semibold text-teal mt-3">{wXp >= goal ? "¡Objetivo cumplido! 🎉" : "¡Vamos, tú puedes!"}</div>
          <div className="mt-4 flex items-center justify-center"><div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center"><Zap size={26} /></div></div>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tareas de hoy */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2"><h3 className="font-bold text-navy tracking-tight">Misiones de hoy</h3>{todo.length > 0 && <Chip tone="brand">{todo.length} pendientes</Chip>}</div>
            <button onClick={() => onTab("tareas")} className="text-sm font-semibold text-brand">Ver todas</button>
          </div>
          {todo.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">{pick(COPY.noTasks)}</Card>}
          {todo.slice(0, 5).map((a) => {
            const Icon = missionIcon(a.title);
            return (
              <Card key={a.id} className="p-3.5 flex items-center gap-3">
                <IconTile color={me.color}><Icon size={20} /></IconTile>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy truncate">{a.title}</div>
                  {a.status === "rejected" ? <span className="text-xs font-medium text-red-500">Rechazada · reinténtalo</span> : <Chip tone="slate">misión</Chip>}
                </div>
                <div className="text-right mr-1"><div className="font-extrabold text-teal leading-none">+{a.points}</div><div className="text-[10px] text-slate-400">pts</div></div>
                <button onClick={() => mark(a.id)} className="w-9 h-9 rounded-full border-2 border-slate-200 hover:border-teal hover:bg-teal hover:text-white text-transparent flex items-center justify-center transition"><Check size={18} /></button>
              </Card>
            );
          })}
          <Card className="p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center shrink-0"><Zap size={18} /></div>
            <div><div className="font-semibold text-navy text-sm">Marca las misiones cuando las completes</div><div className="text-xs text-slate-500">Tamar y Ricardo las validan y sumas puntos.</div></div>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">
          {/* Tu progreso */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-navy tracking-tight">Tu progreso</h3></div>
            <div className="flex items-end justify-between gap-2 h-24">
              {bars.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-lg transition-all" style={{ height: `${Math.max(6, (v / barMax) * 80)}px`, background: days[i] === weekdayName ? "#FF8A00" : "#19D3AE" }} />
                  <span className="text-[11px] font-medium text-slate-400">{days[i]}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-slate-100"><span className="text-sm text-slate-400 font-medium">Esta semana</span><span className="font-extrabold text-teal">{wXp} pts</span></div>
          </Card>

          {/* Próxima recompensa */}
          {next && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <IconTile color="#FF8A00"><NextIcon size={20} /></IconTile>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-400">Próxima recompensa</div>
                  <div className="font-bold text-navy leading-tight">{next.title}</div>
                </div>
              </div>
              <div className="mt-3"><Bar v={me.total_points} max={next.cost} /></div>
              <div className="text-xs font-semibold text-brand mt-2">Faltan {next.cost - me.total_points} puntos</div>
            </Card>
          )}

          {/* Medallas */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-navy tracking-tight">Tus medallas</h3><button onClick={() => setShowBadges(true)} className="text-sm font-semibold text-brand">Ver todas</button></div>
            <div className="grid grid-cols-4 gap-3">
              {catalog.slice(0, 8).map((b) => {
                const Icon = badgeIcon(b.icon);
                const on = earned.has(b.code);
                return (
                  <div key={b.code} className="flex flex-col items-center" title={b.name}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${on ? "text-white" : "bg-slate-100 text-slate-300"}`} style={on ? { background: b.color } : undefined}><Icon size={22} /></div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-3">{earned.size} de {catalog.length} desbloqueadas</div>
          </Card>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Mercado */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><ArrowLeftRight size={18} className="text-navy" /><h3 className="font-bold text-navy tracking-tight">Mercado de hermanos</h3></div><button onClick={onMercado} className="text-sm font-semibold text-brand">Ver mercado</button></div>
          {incoming ? (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div className="flex-1"><div className="text-xs text-slate-400">{db.kids.find((k) => k.id === incoming.from_kid)?.name} te ofrece</div><div className="font-semibold text-navy">{incoming.reason || "Una misión"}</div></div>
              <div className="text-center"><div className="font-extrabold text-teal">+{incoming.points}</div><div className="text-[10px] text-slate-400">pts</div></div>
            </div>
          ) : (
            <button onClick={onMercado} className="w-full text-left bg-slate-50 rounded-xl p-3 text-sm text-slate-400 font-medium">Sin ofertas ahora. Toca para crear una.</button>
          )}
        </Card>

        {/* Reto de equipo */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-brand text-white px-4 py-2.5 flex items-center justify-between"><span className="font-bold text-sm">{challengeLabel}</span><span className="text-xs font-medium flex items-center gap-1"><Clock size={13} /> {daysLeft} días restantes</span></div>
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-bold text-navy">{challengeLabel}</div>
              <div className="text-xs text-slate-500 mb-2">Gana {teamGoal} pts en equipo</div>
              <Bar v={tWeek} max={teamGoal} />
              <div className="text-xs font-semibold text-slate-400 mt-1.5">{tWeek}/{teamGoal}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 text-yellow-500 flex items-center justify-center"><Trophy size={26} /></div>
          </div>
        </Card>
      </div>

      {showBadges && (
        <Modal title="Logros" onClose={() => setShowBadges(false)}>
          <div className="space-y-2.5">
            {catalog.map((b) => {
              const Icon = badgeIcon(b.icon);
              const on = earned.has(b.code);
              return (
                <div key={b.code} className={`flex items-center gap-3 p-3 rounded-xl ${on ? "bg-slate-50" : "opacity-50"}`}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: on ? b.color : "#CBD5E1" }}><Icon size={20} /></div>
                  <div className="flex-1 min-w-0"><div className="font-semibold text-navy">{b.name}</div><div className="text-xs text-slate-400">{b.description}</div></div>
                  {on && <span className="text-xs font-bold text-teal">✓</span>}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
