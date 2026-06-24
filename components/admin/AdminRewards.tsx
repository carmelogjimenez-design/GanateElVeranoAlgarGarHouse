"use client";
import { useState } from "react";
import { Btn } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import type { Ctx } from "@/lib/types";

export default function AdminRewards({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ title: "", description: "", emoji: "🎁", cost: 10 });
  const create = async () => {
    if (!f.title) return;
    await sb.from("rewards").insert(f);
    flash("Premio creado"); setF({ ...f, title: "", description: "" }); refresh();
  };
  return (
    <div className="pb-6">
      <div className="bg-white rounded-3xl p-4 shadow-sm space-y-2">
        <h3 className="font-black">Nuevo premio</h3>
        <div className="flex gap-2">
          <input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} className="w-14 text-center text-2xl border-2 rounded-2xl" />
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título" className="flex-1 border-2 rounded-2xl px-3 py-2.5" />
          <input type="number" value={f.cost} onChange={(e) => setF({ ...f, cost: +e.target.value })} className="w-20 border-2 rounded-2xl px-3 py-2.5" />
        </div>
        <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descripción" className="w-full border-2 rounded-2xl px-3 py-2.5" />
        <Btn className="w-full" onClick={create}>Crear premio</Btn>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {db.rewards.map((r) => (
          <div key={r.id} className="bg-white rounded-3xl p-3 shadow-sm">
            <div className="text-2xl">{r.emoji}</div>
            <div className="font-bold">{r.title}</div>
            <div className="text-xs text-slate-500">{r.cost} pts</div>
            <button onClick={async () => { await sb.from("rewards").delete().eq("id", r.id); refresh(); }} className="text-red-400 text-sm font-bold mt-1">Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
