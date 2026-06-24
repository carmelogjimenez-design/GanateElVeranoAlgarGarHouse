"use client";
import { useState } from "react";
import { Btn } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx, Kid } from "@/lib/types";

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
      <div className="bg-white rounded-3xl p-4 shadow-sm space-y-2">
        <p className="font-bold text-sm text-slate-500">Regala / ofrece puntos a un hermano (p. ej. &quot;te pago 5 por mi baño&quot;).</p>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full border-2 rounded-2xl px-3 py-3 font-bold">
          <option value="">¿A quién?</option>
          {db.kids.filter((k) => k.id !== me.id).map((k) => <option key={k.id} value={k.id}>{k.emoji} {k.name}</option>)}
        </select>
        <input value={pts} onChange={(e) => setPts(e.target.value)} inputMode="numeric" placeholder="Puntos" className="w-full border-2 rounded-2xl px-3 py-3" />
        <input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Motivo (opcional)" className="w-full border-2 rounded-2xl px-3 py-3" />
        <Btn className="w-full" onClick={() => to && pts && send()}>Enviar oferta</Btn>
      </div>
      <h3 className="font-black mt-4 mb-2">Tus movimientos</h3>
      {db.gifts.filter((g) => g.from_kid === me.id || g.to_kid === me.id).map((g) => {
        const out = g.from_kid === me.id;
        const other = db.kids.find((k) => k.id === (out ? g.to_kid : g.from_kid));
        return (
          <div key={g.id} className="bg-white rounded-3xl p-3 mb-2 flex justify-between text-sm font-bold">
            <span>{out ? "➡️ Para" : "⬅️ De"} {other?.name}</span>
            <span>{out ? "-" : "+"}{g.points} · {g.status}</span>
          </div>
        );
      })}
    </div>
  );
}
