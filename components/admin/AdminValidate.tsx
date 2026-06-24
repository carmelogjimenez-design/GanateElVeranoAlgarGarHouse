"use client";
import { Chip, Btn, Section } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx } from "@/lib/types";

export default function AdminValidate({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const name = (id: string) => db.kids.find((k) => k.id === id)?.name || "?";
  const asg = db.assignments.filter((a) => a.status === "pending");
  const red = db.redemptions.filter((r) => r.status === "pending");
  const gif = db.gifts.filter((g) => g.status === "pending");
  const call = async (fn: string, args: Record<string, unknown>, msg: string) => {
    const { error } = await rpc(fn, args);
    flash(error ? error.message : msg);
    refresh();
  };
  if (!asg.length && !red.length && !gif.length)
    return <p className="text-slate-400 font-semibold text-center py-10">Nada pendiente. Reina la paz… por ahora. 🕊️</p>;
  return (
    <div className="space-y-4 pb-6">
      {asg.length > 0 && (
        <Section t="Tareas para revisar">
          {asg.map((a) => (
            <div key={a.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex justify-between"><span className="font-black">{a.title}</span><Chip>{a.points} pts</Chip></div>
              <p className="text-sm text-slate-500">{name(a.kid_id)}{a.note ? ` · "${a.note}"` : ""}</p>
              <div className="flex gap-2 mt-3">
                <Btn c="bg-green-500" className="flex-1" onClick={() => call("approve_assignment", { p_assignment: a.id }, "Validada. +" + a.points)}>Validar</Btn>
                <Btn c="bg-red-500" className="flex-1" onClick={() => {
                  const p = prompt("Penalización en puntos (0 = ninguna):", "0");
                  call("reject_assignment", { p_assignment: a.id, p_penalty: +(p || 0) }, "Rechazada. Recoger no es esconder.");
                }}>Rechazar</Btn>
              </div>
            </div>
          ))}
        </Section>
      )}
      {red.length > 0 && (
        <Section t="Canjes de premios">
          {red.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex justify-between"><span className="font-black">{r.title}</span><Chip c="#ec4899">{r.cost} pts</Chip></div>
              <p className="text-sm text-slate-500">{name(r.kid_id)}</p>
              <div className="flex gap-2 mt-3">
                <Btn c="bg-green-500" className="flex-1" onClick={() => call("approve_redemption", { p_id: r.id }, "Canje aprobado 🎁")}>Aprobar</Btn>
                <Btn c="bg-slate-400" className="flex-1" onClick={() => call("reject_redemption", { p_id: r.id }, "Canje rechazado")}>Rechazar</Btn>
              </div>
            </div>
          ))}
        </Section>
      )}
      {gif.length > 0 && (
        <Section t="Mercado de puntos">
          {gif.map((g) => (
            <div key={g.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <p className="font-bold">{name(g.from_kid)} ➡️ {name(g.to_kid)} · {g.points} pts</p>
              <p className="text-sm text-slate-500">{g.reason}</p>
              <div className="flex gap-2 mt-3">
                <Btn c="bg-green-500" className="flex-1" onClick={() => call("approve_gift", { p_id: g.id }, "Transferencia hecha 🤝")}>Aprobar</Btn>
                <Btn c="bg-slate-400" className="flex-1" onClick={() => call("reject_gift", { p_id: g.id }, "Transferencia rechazada")}>Rechazar</Btn>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
