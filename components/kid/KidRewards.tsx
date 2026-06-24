"use client";
import { Btn } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx, Kid, Reward } from "@/lib/types";

export default function KidRewards({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const ask = async (r: Reward) => {
    const { error } = await rpc("request_redemption", { p_kid: me.id, p_pin: kid!.pin, p_reward: r.id });
    flash(error ? error.message : "Canje solicitado. Ahora a convencer a los jefes.");
    if (!error) refresh();
  };
  return (
    <div className="grid grid-cols-2 gap-3 pb-6">
      {db.rewards.filter((r) => r.active).map((r) => {
        const can = me.total_points >= r.cost;
        return (
          <div key={r.id} className="bg-white rounded-3xl p-4 shadow-sm flex flex-col">
            <span className="text-3xl">{r.emoji}</span>
            <span className="font-black mt-1">{r.title}</span>
            <span className="text-xs text-slate-500 flex-1">{r.description}</span>
            <Btn c={can ? "bg-orange-500" : "bg-slate-300"} className="w-full mt-2 text-sm" onClick={() => can && ask(r)}>
              {r.cost} pts {can ? "" : "🔒"}
            </Btn>
          </div>
        );
      })}
    </div>
  );
}
