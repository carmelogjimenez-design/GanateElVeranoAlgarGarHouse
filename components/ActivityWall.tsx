"use client";
import { Card, Avatar } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { sfx } from "@/lib/sfx";
import type { Ctx } from "@/lib/types";
import { Radio } from "lucide-react";

const EMOJIS = ["🔥", "👏", "😂", "💪"];

export default function ActivityWall({ ctx, author, max = 12 }: { ctx: Ctx; author: string; max?: number }) {
  const { db, refresh } = ctx;
  const feed = db.point_events.filter((e) => e.delta > 0).slice(0, max);
  const kidOf = (id: string | null) => db.kids.find((k) => k.id === id);

  const react = async (eventId: string, emoji: string) => {
    const mine = db.activity_reactions.find((r) => r.event_id === eventId && r.emoji === emoji && r.author === author);
    sfx("tap");
    if (mine) await sb.from("activity_reactions").delete().eq("event_id", eventId).eq("emoji", emoji).eq("author", author);
    else await sb.from("activity_reactions").insert({ event_id: eventId, emoji, author });
    refresh();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span>
        <h3 className="font-bold text-navy tracking-tight flex items-center gap-1.5"><Radio size={16} className="text-red-500" /> En directo</h3>
      </div>
      <Card className="p-4 space-y-3">
        {feed.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Cuando alguien gane puntos, aparecerá aquí 🔥</p>}
        {feed.map((e) => {
          const k = kidOf(e.kid_id);
          return (
            <div key={e.id} className="flex gap-3">
              {k ? <Avatar name={k.name} color={k.color} size={34} avatar={k.avatar} /> : <div className="w-[34px]" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-snug"><span className="font-bold text-navy">🔥 {k?.name || "Alguien"}</span> <span className="text-slate-500 font-medium">{e.reason || "ha ganado puntos"}</span> <span className="font-bold text-teal">+{e.delta}</span></div>
                <div className="flex gap-1.5 mt-1.5">
                  {EMOJIS.map((em) => {
                    const list = db.activity_reactions.filter((r) => r.event_id === e.id && r.emoji === em);
                    const mine = list.some((r) => r.author === author);
                    return (
                      <button key={em} onClick={() => react(e.id, em)} className={`text-xs font-bold rounded-full px-2 py-1 transition active:scale-90 ${mine ? "bg-brand/15 ring-1 ring-brand/40" : "bg-slate-100"}`}>
                        <span>{em}</span>{list.length > 0 && <span className="ml-1 text-slate-500">{list.length}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
