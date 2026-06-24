"use client";
import { useState } from "react";
import { Card, Btn, IconTile, Bar, Input } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import { notifyParents } from "@/lib/push";
import { missionIcon } from "@/lib/icons";
import type { Ctx, Kid, Reward } from "@/lib/types";
import { Lock, Sparkles, Star } from "lucide-react";

export default function KidRewards({ ctx, me, onCelebrate }: { ctx: Ctx; me: Kid; onCelebrate?: () => void }) {
  const { db, flash, refresh, kid } = ctx;
  const [wish, setWish] = useState("");
  const [cost, setCost] = useState(50);
  const pending = db.redemptions.filter((r) => r.kid_id === me.id && r.status === "pending");

  const ask = async (r: Reward) => {
    const { error } = await rpc("request_redemption", { p_kid: me.id, p_pin: kid!.pin, p_reward: r.id });
    if (error) { flash(error.message); return; }
    onCelebrate?.(); notifyParents("Gánate el Verano", `${me.name} quiere canjear: ${r.title}`); refresh();
  };
  const askCustom = async () => {
    if (!wish.trim()) { flash("Escribe qué recompensa quieres"); return; }
    const { error } = await rpc("request_custom_reward", { p_kid: me.id, p_pin: kid!.pin, p_title: wish.trim(), p_cost: Math.max(0, cost) });
    if (error) { flash(error.message); return; }
    setWish(""); onCelebrate?.(); notifyParents("Gánate el Verano", `${me.name} pide una recompensa especial: ${wish.trim()}`); refresh();
  };

  return (
    <div className="pb-6 space-y-5">
      {/* saldo */}
      <Card className="p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#0B1F3A,#15315c)" }}>
        <div>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wide">Tu saldo</div>
          <div className="text-3xl font-extrabold text-white tabular-nums">{me.total_points} <span className="text-base font-semibold text-white/60">XP</span></div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center"><Star size={26} className="text-amber-400 fill-amber-400" /></div>
      </Card>

      <div>
        <h3 className="font-bold text-navy tracking-tight px-0.5 mb-3">Tienda de recompensas</h3>
        <div className="grid grid-cols-2 gap-3">
          {db.rewards.filter((r) => r.active).map((r) => {
            const can = me.total_points >= r.cost;
            const Icon = missionIcon(r.title);
            return (
              <Card key={r.id} className="p-4 flex flex-col">
                <IconTile color={can ? "#19D3AE" : "#94A3B8"}>{can ? <Icon size={20} /> : <Lock size={18} />}</IconTile>
                <div className="font-semibold text-navy mt-2 leading-tight">{r.title}</div>
                <div className="text-xs text-slate-400 flex-1 mt-0.5">{r.description}</div>
                {!can && <div className="mt-2"><Bar v={me.total_points} max={r.cost} c="#19D3AE" /></div>}
                <Btn variant={can ? "teal" : "muted"} className="w-full mt-3 text-sm py-2.5" onClick={() => can && ask(r)}>
                  {can ? `Canjear · ${r.cost} XP` : `${r.cost} XP`}
                </Btn>
              </Card>
            );
          })}
        </div>
      </div>

      {/* recompensa personalizada */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1"><Sparkles size={16} className="text-brand" /><h3 className="font-bold text-navy tracking-tight">Pide una recompensa especial</h3></div>
        <p className="text-sm text-slate-400 font-medium mb-3">¿Quieres algo que no está en la tienda? Pídelo y tus padres deciden si lo aprueban.</p>
        <Input value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Ej. Ir al cine, una pizza, quedarme despierto…" className="mb-2" />
        <div className="flex gap-2">
          <Input type="number" value={cost} onChange={(e) => setCost(+e.target.value)} className="w-28" />
          <Btn variant="primary" className="flex-1" onClick={askCustom}>Pedir (cuesta {Math.max(0, cost)} XP)</Btn>
        </div>
      </Card>

      {pending.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold text-navy tracking-tight mb-2">Esperando aprobación</h3>
          <div className="space-y-1.5">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1">
                <span className="font-medium text-navy truncate">{r.title}</span>
                <span className="text-amber-500 font-semibold">{r.cost} XP · pendiente</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
