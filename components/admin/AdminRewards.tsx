"use client";
import { useState } from "react";
import { Card, Btn, Input, IconTile, Chip } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { missionIcon } from "@/lib/icons";
import type { Ctx } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export default function AdminRewards({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ title: "", description: "", cost: 100 });
  const create = async () => {
    if (!f.title) return;
    await sb.from("rewards").insert(f); flash("Recompensa creada"); setF({ ...f, title: "", description: "" }); refresh();
  };
  return (
    <div className="pb-6">
      <Card className="p-4 space-y-2.5 mb-4">
        <h3 className="font-bold text-navy tracking-tight">Nueva recompensa</h3>
        <div className="flex gap-2">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título" />
          <Input type="number" value={f.cost} onChange={(e) => setF({ ...f, cost: +e.target.value })} className="w-24" placeholder="XP" />
        </div>
        <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descripción" />
        <Btn variant="teal" className="w-full flex items-center justify-center gap-1.5" onClick={create}><Plus size={17} /> Crear recompensa</Btn>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {db.rewards.map((r) => {
          const Icon = missionIcon(r.title);
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <IconTile color="#19D3AE"><Icon size={20} /></IconTile>
                <button onClick={async () => { await sb.from("rewards").delete().eq("id", r.id); refresh(); }} className="text-slate-300 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
              <div className="font-semibold text-navy mt-2">{r.title}</div>
              <div className="mt-1"><Chip tone="teal">{r.cost} XP</Chip></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
