"use client";
import { Card, Avatar, Bar, Chip } from "@/components/ui/atoms";
import { levelOf } from "@/lib/game";
import type { DB } from "@/lib/types";
import { Trophy } from "lucide-react";

export default function RankingList({ db, highlight }: { db: DB; highlight?: string }) {
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  return (
    <div className="pb-6">
      <h3 className="font-bold text-navy tracking-tight px-0.5 mb-3 flex items-center gap-2"><Trophy size={18} className="text-brand" /> Clasificación general</h3>
      <Card className="p-4">
        {ranking.map((k, i) => (
          <div key={k.id} className={`flex items-center gap-3 py-2 ${k.id === highlight ? "-mx-2 px-2 bg-orange-50 rounded-xl" : ""}`}>
            <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-brand" : "text-slate-300"}`}>{i + 1}</span>
            <Avatar name={k.name} color={k.color} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm"><span className="font-semibold text-navy truncate">{k.name}</span><span className="font-bold text-navy tabular-nums">{k.total_points} XP</span></div>
              <div className="flex items-center gap-2 mt-1"><Chip tone="slate">Nv {levelOf(k.total_points)}</Chip><div className="flex-1"><Bar v={k.total_points} max={max} c={k.color} /></div></div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
