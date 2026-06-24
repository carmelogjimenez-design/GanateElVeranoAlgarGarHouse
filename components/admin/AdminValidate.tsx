"use client";
import { Card, Chip, Btn, Section, Avatar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx } from "@/lib/types";
import { Check, X } from "lucide-react";

export default function AdminValidate({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const kidOf = (id: string) => db.kids.find((k) => k.id === id);
  const asg = db.assignments.filter((a) => a.status === "pending");
  const red = db.redemptions.filter((r) => r.status === "pending");
  const gif = db.gifts.filter((g) => g.status === "pending");
  const call = async (fn: string, args: Record<string, unknown>, msg: string) => {
    const { error } = await rpc(fn, args); flash(error ? error.message : msg); refresh();
  };
  if (!asg.length && !red.length && !gif.length)
    return <Card className="p-8 text-center text-slate-400 font-medium">Nada pendiente. Reina la paz… por ahora.</Card>;
  return (
    <div className="space-y-5 pb-6">
      {asg.length > 0 && (
        <Section title="Misiones para revisar">
          {asg.map((a) => {
            const k = kidOf(a.kid_id);
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {k && <Avatar name={k.name} color={k.color} size={36} />}
                  <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{a.title}</div><div className="text-xs text-slate-400">{k?.name}{a.note ? ` · "${a.note}"` : ""}</div></div>
                  <Chip tone="brand">+{a.points} XP</Chip>
                </div>
                <div className="flex gap-2">
                  <Btn variant="teal" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => call("approve_assignment", { p_assignment: a.id }, "Validada. +" + a.points + " XP")}><Check size={16} /> Validar</Btn>
                  <Btn variant="ghost" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => { const p = prompt("Penalización en XP (0 = ninguna):", "0"); call("reject_assignment", { p_assignment: a.id, p_penalty: +(p || 0) }, "Rechazada."); }}><X size={16} /> Rechazar</Btn>
                </div>
              </Card>
            );
          })}
        </Section>
      )}
      {red.length > 0 && (
        <Section title="Canjes de la tienda">
          {red.map((r) => {
            const k = kidOf(r.kid_id);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {k && <Avatar name={k.name} color={k.color} size={36} />}
                  <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{r.title}</div><div className="text-xs text-slate-400">{k?.name}</div></div>
                  <Chip tone="teal">{r.cost} XP</Chip>
                </div>
                <div className="flex gap-2">
                  <Btn variant="teal" className="flex-1" onClick={() => call("approve_redemption", { p_id: r.id }, "Canje aprobado")}>Aprobar</Btn>
                  <Btn variant="ghost" className="flex-1" onClick={() => call("reject_redemption", { p_id: r.id }, "Canje rechazado")}>Rechazar</Btn>
                </div>
              </Card>
            );
          })}
        </Section>
      )}
      {gif.length > 0 && (
        <Section title="Mercado de XP">
          {gif.map((g) => (
            <Card key={g.id} className="p-4">
              <div className="font-semibold text-navy mb-1">{kidOf(g.from_kid)?.name} → {kidOf(g.to_kid)?.name} · {g.points} XP</div>
              <div className="text-xs text-slate-400 mb-3">{g.reason || "Sin motivo"}</div>
              <div className="flex gap-2">
                <Btn variant="teal" className="flex-1" onClick={() => call("approve_gift", { p_id: g.id }, "Transferencia hecha")}>Aprobar</Btn>
                <Btn variant="ghost" className="flex-1" onClick={() => call("reject_gift", { p_id: g.id }, "Transferencia rechazada")}>Rechazar</Btn>
              </div>
            </Card>
          ))}
        </Section>
      )}
    </div>
  );
}
