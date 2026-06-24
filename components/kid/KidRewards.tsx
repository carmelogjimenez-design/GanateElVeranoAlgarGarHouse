"use client";
import { Card, Btn, IconTile, Bar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import { missionIcon } from "@/lib/icons";
import type { Ctx, Kid, Reward } from "@/lib/types";
import { Lock } from "lucide-react";

export default function KidRewards({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const ask = async (r: Reward) => {
    const { error } = await rpc("request_redemption", { p_kid: me.id, p_pin: kid!.pin, p_reward: r.id });
    flash(error ? error.message : "Canje solicitado. A convencer a los jefes.");
    if (!error) refresh();
  };
  return (
    <div className="pb-6">
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
  );
}
