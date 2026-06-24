"use client";
import { useState } from "react";
import { Chip } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import RankingList from "@/components/RankingList";
import KidTasks from "@/components/kid/KidTasks";
import KidRewards from "@/components/kid/KidRewards";
import KidMarket from "@/components/kid/KidMarket";
import KidStudy from "@/components/kid/KidStudy";
import type { Ctx } from "@/lib/types";

export default function KidApp({ ctx }: { ctx: Ctx }) {
  const { db, kid, setScreen } = ctx;
  const me = db.kids.find((k) => k.id === kid!.id) || kid!;
  const [tab, setTab] = useState("hoy");
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const rank = ranking.findIndex((k) => k.id === me.id) + 1;
  const myAsg = db.assignments.filter((a) => a.kid_id === me.id);
  const streak = new Set(
    myAsg.filter((a) => a.status === "approved" && a.validated_at).map((a) => a.validated_at!.slice(0, 10))
  ).size;

  const tabs: [string, string][] = [["hoy", "✅ Hoy"], ["premios", "🎁 Premios"], ["mercado", "🤝 Mercado"]];
  if (me.study_enabled) tabs.push(["estudio", "📚 Estudio"]);
  tabs.push(["rank", "🏆 Ranking"]);

  return (
    <div>
      <div className="px-4 pt-6 pb-4 text-white" style={{ background: me.color }}>
        <div className="flex justify-between items-center">
          <button onClick={() => setScreen("lobby")} className="font-bold">‹ Salir</button>
          <Chip c="rgba(0,0,0,.25)">#{rank} del ranking</Chip>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-5xl">{me.emoji}</span>
          <div>
            <div className="text-2xl font-black">{me.name}</div>
            <div className="font-bold opacity-90">{me.total_points} pts · 🔥 {streak} días</div>
          </div>
        </div>
        <p className="mt-3 font-semibold text-sm bg-black/15 rounded-xl px-3 py-2">{pick(COPY.kidWelcome(me.name))}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap px-3 py-2 rounded-2xl font-bold text-sm ${tab === k ? "bg-slate-800 text-white" : "bg-white"}`}>{l}</button>
        ))}
      </div>

      <div className="px-4">
        {tab === "hoy" && <KidTasks ctx={ctx} me={me} asg={myAsg} />}
        {tab === "premios" && <KidRewards ctx={ctx} me={me} />}
        {tab === "mercado" && <KidMarket ctx={ctx} me={me} />}
        {tab === "estudio" && <KidStudy ctx={ctx} me={me} />}
        {tab === "rank" && <RankingList db={db} highlight={me.id} />}
      </div>
    </div>
  );
}
