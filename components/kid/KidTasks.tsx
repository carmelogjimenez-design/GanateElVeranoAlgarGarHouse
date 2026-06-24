"use client";
import { Chip, Btn } from "@/components/ui/atoms";
import { COPY, pick } from "@/lib/copy";
import { rpc } from "@/lib/helpers";
import type { Ctx, Kid, Assignment } from "@/lib/types";

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
    <div className="space-y-3 pb-6">
      {pending.length === 0 && <p className="text-slate-400 font-semibold text-center py-6">{pick(COPY.noTasks)}</p>}
      {pending.map((a) => (
        <div key={a.id} className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex justify-between"><span className="font-black">{a.title}</span><Chip>{a.points} pts</Chip></div>
          {a.status === "rejected" && <p className="text-red-500 text-xs font-bold mt-1">Rechazada antes. A la segunda va la vencida.</p>}
          <Btn className="w-full mt-3" onClick={() => mark(a)}>Marcar como hecha</Btn>
        </div>
      ))}
      {wait.map((a) => (
        <div key={a.id} className="bg-amber-100 rounded-3xl p-3 flex justify-between items-center">
          <span className="font-bold text-amber-800">⏳ {a.title}</span><span className="text-xs font-bold text-amber-700">En revisión</span>
        </div>
      ))}
      {done.map((a) => (
        <div key={a.id} className="bg-green-100 rounded-3xl p-3 flex justify-between items-center">
          <span className="font-bold text-green-800">✅ {a.title}</span><span className="text-xs font-bold text-green-700">+{a.points}</span>
        </div>
      ))}
    </div>
  );
}
