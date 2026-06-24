"use client";
import { useState } from "react";
import { Card, Btn, Input, Avatar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx, Kid } from "@/lib/types";
import { ArrowRight } from "lucide-react";

export default function KidMarket({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const [to, setTo] = useState("");
  const [pts, setPts] = useState("");
  const [why, setWhy] = useState("");
  const send = async () => {
    const { error } = await rpc("request_gift", { p_from: me.id, p_pin: kid!.pin, p_to: to, p_points: +pts, p_reason: why });
    if (error) flash(error.message);
    else { flash("Oferta enviada. Los padres deben dar el OK."); setPts(""); setWhy(""); refresh(); }
  };
  return (
    <div className="pb-6">
      <h3 className="font-bold text-navy tracking-tight px-0.5 mb-3">Mercado entre hermanos</h3>
      <Card className="p-4 space-y-2.5">
        <p className="text-sm text-slate-400 font-medium">Ofrece XP a un hermano (ej. &quot;te pago 5 XP por mi misión&quot;).</p>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-[15px] font-medium">
          <option value="">¿A quién?</option>
          {db.kids.filter((k) => k.id !== me.id).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <Input value={pts} onChange={(e) => setPts(e.target.value)} inputMode="numeric" placeholder="XP a ofrecer" />
        <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Motivo (opcional)" />
        <Btn variant="primary" className="w-full flex items-center justify-center gap-2" onClick={() => to && pts && send()}>Enviar oferta <ArrowRight size={16} /></Btn>
      </Card>
      <h4 className="font-semibold text-navy text-sm mt-5 mb-2 px-0.5">Tus movimientos</h4>
      <div className="space-y-2">
        {db.gifts.filter((g) => g.from_kid === me.id || g.to_kid === me.id).map((g) => {
          const out = g.from_kid === me.id;
          const other = db.kids.find((k) => k.id === (out ? g.to_kid : g.from_kid));
          return (
            <Card key={g.id} className="p-3 flex items-center gap-3">
              {other && <Avatar name={other.name} color={other.color} size={32} />}
              <span className="text-sm font-medium text-navy flex-1">{out ? "Para" : "De"} {other?.name}</span>
              <span className={`text-sm font-bold ${out ? "text-red-500" : "text-teal"}`}>{out ? "-" : "+"}{g.points} XP</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
