"use client";
import { Bar } from "@/components/ui/atoms";
import type { DB } from "@/lib/types";

export default function RankingList({ db, highlight }: { db: DB; highlight?: string }) {
  const ranking = [...db.kids].sort((a, b) => b.total_points - a.total_points);
  const max = ranking[0]?.total_points || 1;
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm mb-6">
      {ranking.map((k, i) => (
        <div key={k.id} className={`flex items-center gap-3 py-1.5 ${k.id === highlight ? "bg-orange-50 rounded-xl px-2" : ""}`}>
          <span className="w-6 text-center font-black">{medals[i] || i + 1}</span>
          <span className="text-2xl">{k.emoji}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm font-bold"><span>{k.name}</span><span>{k.total_points}</span></div>
            <Bar v={k.total_points} max={max} c={k.color} />
          </div>
        </div>
      ))}
    </div>
  );
}
