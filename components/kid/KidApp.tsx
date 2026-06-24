"use client";
import { useState } from "react";
import { Card, Avatar, Ring, Chip, Bar, IconTile } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import { levelOf, levelProgress, xpToNext, nearestReward } from "@/lib/game";
import { missionIcon } from "@/lib/icons";
import RankingList from "@/components/RankingList";
import KidTasks from "@/components/kid/KidTasks";
import KidRewards from "@/components/kid/KidRewards";
import KidMarket from "@/components/kid/KidMarket";
import KidStudy from "@/components/kid/KidStudy";
import type { Ctx } from "@/lib/types";
import { Target, ShoppingBag, ArrowLeftRight, BookOpen, Trophy, ChevronLeft, Flame, Gift } from "lucide-react";

export default function KidApp({ ctx }: { ctx: Ctx }) {
  const { db, kid, setScreen } = ctx;
  const me = db.kids.find((k) => k.id === kid!.id) || kid!;
  const [tab, setTab] = useState("misiones");
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const rank = ranking.findIndex((k) => k.id === me.id) + 1;
  const team = db.teams.find((t) => t.id === me.team_id);
  const myAsg = db.assignments.filter((a) => a.kid_id === me.id);
  const streak = new Set(myAsg.filter((a) => a.status === "approved" && a.validated_at).map((a) => a.validated_at!.slice(0, 10))).size;
  const next = nearestReward(me, db.rewards);

  const nav: [string, string, typeof Target][] = [
    ["misiones", "Misiones", Target], ["tienda", "Tienda", ShoppingBag],
    ["mercado", "Mercado", ArrowLeftRight],
  ];
  if (me.study_enabled) nav.push(["estudio", "Estudio", BookOpen]);
  nav.push(["rank", "Ranking", Trophy]);

  const NextRewardIcon = next ? missionIcon(next.title) : Gift;

  return (
    <div className="min-h-screen pb-24">
      {/* top bar */}
      <div className="sticky top-0 z-20 bg-navy text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setScreen("lobby")} className="flex items-center gap-1 text-sm font-medium opacity-80"><ChevronLeft size={18} /> Salir</button>
        <span className="font-bold tracking-tight">{me.name}</span>
        <span className="text-sm font-bold tabular-nums">{me.total_points} <span className="opacity-60 font-medium">XP</span></span>
      </div>

      <div className="px-4 pt-4">
        {tab === "misiones" && (
          <>
            {/* HERO */}
            <Card className="bg-navy border-navy p-5 mb-4 text-white">
              <div className="flex items-center gap-5">
                <Ring value={levelProgress(me.total_points)} size={104} stroke={9} color={me.color}>
                  <span className="text-[11px] font-medium opacity-70 -mb-1">Nivel</span>
                  <span className="text-2xl font-extrabold">{levelOf(me.total_points)}</span>
                </Ring>
                <div className="flex-1 min-w-0">
                  <Avatar name={me.name} color={me.color} size={34} />
                  <div className="text-lg font-extrabold tracking-tight mt-2 leading-none">{me.name}</div>
                  <div className="text-xs opacity-60 mt-1">{team?.name || "Sin equipo"}</div>
                  <div className="text-[13px] font-medium text-teal mt-2">Faltan {xpToNext(me.total_points)} XP para Nv {levelOf(me.total_points) + 1}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-white/10 rounded-xl py-2 text-center"><div className="text-[11px] opacity-60">Posición</div><div className="font-bold">#{rank}</div></div>
                <div className="flex-1 bg-white/10 rounded-xl py-2 text-center"><div className="text-[11px] opacity-60 flex items-center justify-center gap-1"><Flame size={11} /> Racha</div><div className="font-bold">{streak} días</div></div>
                <div className="flex-1 bg-white/10 rounded-xl py-2 text-center"><div className="text-[11px] opacity-60">XP total</div><div className="font-bold">{me.total_points}</div></div>
              </div>
            </Card>

            {/* recompensa más cercana */}
            {next && (
              <Card className="p-4 mb-5">
                <div className="flex items-center gap-3">
                  <IconTile color="#FF8A00"><NextRewardIcon size={20} /></IconTile>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-medium text-slate-400">Tu próxima recompensa</span>
                      <span className="text-xs font-bold text-brand">Faltan {next.cost - me.total_points} XP</span>
                    </div>
                    <div className="font-bold text-navy tracking-tight">{next.title}</div>
                    <div className="mt-1.5"><Bar v={me.total_points} max={next.cost} /></div>
                  </div>
                </div>
              </Card>
            )}

            <p className="text-xs font-medium text-slate-400 mb-3 px-0.5">{pick(COPY.kidWelcome(me.name))}</p>
            <KidTasks ctx={ctx} me={me} asg={myAsg} />
          </>
        )}
        {tab === "tienda" && <KidRewards ctx={ctx} me={me} />}
        {tab === "mercado" && <KidMarket ctx={ctx} me={me} />}
        {tab === "estudio" && <KidStudy ctx={ctx} me={me} />}
        {tab === "rank" && <RankingList db={db} highlight={me.id} />}
      </div>

      {/* bottom nav */}
      <div className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-md mx-auto bg-white/95 backdrop-blur border-t border-slate-200 flex">
          {nav.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 ${tab === k ? "text-brand" : "text-slate-400"}`}>
              <Icon size={21} strokeWidth={tab === k ? 2.4 : 2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
