"use client";
import { useState } from "react";
import { Card, Btn, Input, Avatar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import { notifyParents } from "@/lib/push";
import type { Ctx, Kid } from "@/lib/types";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Star, Handshake } from "lucide-react";

export default function KidMarket({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const [to, setTo] = useState("");
  const [pts, setPts] = useState(5);
  const [why, setWhy] = useState("");
  const siblings = db.kids.filter((k) => k.id !== me.id && k.active);
  const send = async () => {
    if (!to) return flash("Elige a un hermano");
    const { error } = await rpc("request_gift", { p_from: me.id, p_pin: kid!.pin, p_to: to, p_points: pts, p_reason: why });
    if (error) flash(error.message);
    else { notifyParents("Gánate el Verano", `${me.name} ofrece ${pts} XP a un hermano`); flash("Oferta enviada. Los padres dan el OK."); setPts(5); setWhy(""); setTo(""); refresh(); }
  };
  const moves = db.gifts.filter((g) => g.from_kid === me.id || g.to_kid === me.id).slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="pb-6 space-y-5">
      <Card className="p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#0B1F3A,#15315c)" }}>
        <div className="w-11 h-11 rounded-2xl bg-teal/20 flex items-center justify-center text-teal"><Handshake size={22} /></div>
        <div className="flex-1">
          <div className="text-white font-extrabold tracking-tight">Mercado entre hermanos</div>
          <div className="text-white/60 text-xs font-medium">Paga XP por favores. Lo aprueban los padres.</div>
        </div>
        <div className="text-right"><div className="text-2xl font-extrabold text-white tabular-nums">{me.total_points}</div><div className="text-[10px] text-white/50 font-semibold">TU XP</div></div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-navy mb-2">1 · ¿A quién?</div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {siblings.map((k) => (
            <button key={k.id} onClick={() => setTo(k.id)} className={`flex flex-col items-center gap-1 rounded-xl p-2 border transition ${to === k.id ? "border-brand bg-orange-50" : "border-transparent hover:bg-slate-50"}`}>
              <Avatar name={k.name} color={k.color} size={40} avatar={k.avatar} />
              <span className="text-[11px] font-semibold text-navy truncate w-full text-center">{k.name}</span>
            </button>
          ))}
        </div>
        <div className="text-sm font-semibold text-navy mb-2">2 · ¿Cuánto y por qué?</div>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setPts((p) => Math.max(1, p - 1))} className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-navy text-lg">−</button>
          <div className="flex-1 text-center"><span className="text-2xl font-extrabold text-navy tabular-nums">{pts}</span><span className="text-sm font-semibold text-slate-400"> XP</span></div>
          <button onClick={() => setPts((p) => p + 1)} className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-navy text-lg">+</button>
        </div>
        <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Ej. por hacer mi misión de la cocina" className="mb-3" />
        <Btn variant="primary" className="w-full flex items-center justify-center gap-2" onClick={send}>Enviar oferta <ArrowRight size={16} /></Btn>
      </Card>

      <div>
        <h4 className="font-semibold text-navy text-sm mb-2 px-0.5">Tus movimientos</h4>
        {moves.length === 0 && <Card className="p-5 text-center text-slate-400 text-sm font-medium">Aún no has hecho ningún trato.</Card>}
        <div className="space-y-2">
          {moves.map((g) => {
            const out = g.from_kid === me.id;
            const other = db.kids.find((k) => k.id === (out ? g.to_kid : g.from_kid));
            return (
              <Card key={g.id} className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${out ? "bg-red-50 text-red-500" : "bg-teal/10 text-teal"}`}>{out ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}</div>
                {other && <Avatar name={other.name} color={other.color} size={30} avatar={other.avatar} />}
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-navy">{out ? "Para" : "De"} {other?.name}</div>{g.reason && <div className="text-xs text-slate-400 truncate">{g.reason}</div>}</div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${out ? "text-red-500" : "text-teal"}`}>{out ? "−" : "+"}{g.points} XP</div>
                  <div className="text-[10px] font-semibold text-slate-400">{g.status === "pending" ? "pendiente" : g.status === "approved" ? "hecho" : "rechazado"}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
