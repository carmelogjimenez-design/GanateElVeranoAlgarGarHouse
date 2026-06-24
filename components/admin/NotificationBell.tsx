"use client";
import { useState } from "react";
import { Bell, ClipboardCheck, Gift, ArrowLeftRight, BookOpen } from "lucide-react";
import type { Ctx } from "@/lib/types";

export default function NotificationBell({ ctx, onGo }: { ctx: Ctx; onGo: (t: string) => void }) {
  const { db } = ctx;
  const [open, setOpen] = useState(false);
  const name = (id: string) => db.kids.find((k) => k.id === id)?.name || "";
  const asg = db.assignments.filter((a) => a.status === "pending");
  const red = db.redemptions.filter((r) => r.status === "pending");
  const gif = db.gifts.filter((g) => g.status === "pending");
  const sr = db.study_rewards.filter((r) => r.status === "pending");
  const total = asg.length + red.length + gif.length + sr.length;
  const items = [
    ...asg.map((a) => ({ Icon: ClipboardCheck, text: `${name(a.kid_id)} · ${a.title}` })),
    ...sr.map((r) => ({ Icon: BookOpen, text: `${name(r.kid_id)} pide su recompensa de estudio` })),
    ...red.map((r) => ({ Icon: Gift, text: `${name(r.kid_id)} quiere canjear: ${r.title}` })),
    ...gif.map((g) => ({ Icon: ArrowLeftRight, text: `${name(g.from_kid)} → ${name(g.to_kid)} · ${g.points} pts` })),
  ];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-full hover:bg-black/5" title="Avisos">
        <Bell size={20} />
        {total > 0 && <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{total}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden text-navy">
            <div className="px-4 py-3 border-b border-slate-100 font-bold">Avisos{total > 0 ? ` (${total})` : ""}</div>
            <div className="max-h-80 overflow-auto">
              {items.length === 0 && <div className="px-4 py-7 text-center text-sm text-slate-400 font-medium">Nada pendiente. Todo en orden.</div>}
              {items.map((it, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><it.Icon size={15} /></div>
                  <span className="flex-1 text-navy">{it.text}</span>
                </div>
              ))}
            </div>
            {total > 0 && <button onClick={() => { setOpen(false); onGo("validar"); }} className="w-full py-3 text-sm font-semibold text-brand border-t border-slate-100">Ir a validar</button>}
          </div>
        </>
      )}
    </div>
  );
}
