"use client";
import { Card, Chip, Btn, IconTile } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import { rpc } from "@/lib/helpers";
import { missionIcon } from "@/lib/icons";
import type { Ctx, Kid, Assignment } from "@/lib/types";
import { Check, Clock, CheckCircle2 } from "lucide-react";

export default function KidTasks({ ctx, me, asg }: { ctx: Ctx; me: Kid; asg: Assignment[] }) {
  const { flash, refresh, kid } = ctx;
  const pending = asg.filter((a) => ["todo", "rejected"].includes(a.status));
  const wait = asg.filter((a) => a.status === "pending");
  const done = asg.filter((a) => a.status === "approved");
  const mark = async (a: Assignment) => {
    const { error } = await rpc("mark_done", { p_assignment: a.id, p_kid: me.id, p_pin: kid!.pin });
    if (error) flash(error.message); else { flash(pick(COPY.done)); refresh(); }
  };
  return (
    <div className="space-y-2.5 pb-6">
      <h3 className="font-bold text-navy tracking-tight px-0.5 mb-1">Misiones de hoy</h3>
      {pending.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">{pick(COPY.noTasks)}</Card>}
      {pending.map((a) => {
        const Icon = missionIcon(a.title);
        return (
          <Card key={a.id} className="p-4">
            <div className="flex items-center gap-3">
              <IconTile color={me.color}><Icon size={20} /></IconTile>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy truncate">{a.title}</div>
                {a.status === "rejected"
                  ? <div className="text-xs font-medium text-red-500 mt-0.5">Rechazada. A la segunda va la vencida.</div>
                  : <Chip tone="brand">+{a.points} XP</Chip>}
              </div>
              <Btn variant="primary" className="px-3 py-2.5" onClick={() => mark(a)}><Check size={18} /></Btn>
            </div>
          </Card>
        );
      })}
      {wait.map((a) => (
        <Card key={a.id} className="p-3.5 flex items-center gap-3">
          <IconTile color="#F59E0B"><Clock size={18} /></IconTile>
          <span className="font-medium text-navy flex-1 truncate">{a.title}</span>
          <Chip tone="amber">En revisión</Chip>
        </Card>
      ))}
      {done.map((a) => (
        <Card key={a.id} className="p-3.5 flex items-center gap-3 opacity-70">
          <IconTile color="#22C55E"><CheckCircle2 size={18} /></IconTile>
          <span className="font-medium text-navy flex-1 truncate line-through decoration-slate-300">{a.title}</span>
          <Chip tone="green">+{a.points} XP</Chip>
        </Card>
      ))}
    </div>
  );
}
