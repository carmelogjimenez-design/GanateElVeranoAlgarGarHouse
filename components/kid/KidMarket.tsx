"use client";
import { useState } from "react";
import { Card, Btn, Input, Avatar, Chip } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import { notifyParents } from "@/lib/push";
import { sfx } from "@/lib/sfx";
import type { Ctx, Kid, MarketOffer } from "@/lib/types";
import { Handshake, Plus, Flame, Check, X, ArrowUpRight, ArrowDownLeft, HandHeart, Coins } from "lucide-react";

export default function KidMarket({ ctx, me }: { ctx: Ctx; me: Kid }) {
  const { db, flash, refresh, kid } = ctx;
  const [kind, setKind] = useState<"offer" | "request">("offer");
  const [title, setTitle] = useState("");
  const [pts, setPts] = useState(5);
  const [busy, setBusy] = useState<string | null>(null);

  const offers = db.market_offers || [];
  const open = offers.filter((o) => o.status === "open").sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const others = open.filter((o) => o.maker_id !== me.id);
  const mineOpen = open.filter((o) => o.maker_id === me.id);
  const chollo = [...others].sort((a, b) => b.points - a.points)[0];
  const mine = offers.filter((o) => o.maker_id === me.id || o.taker_id === me.id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const nameOf = (id: string | null) => db.kids.find((k) => k.id === id)?.name || "—";
  const kidOf = (id: string | null) => db.kids.find((k) => k.id === id);
  const isDoer = (o: MarketOffer) => (o.kind === "offer" ? o.maker_id : o.taker_id) === me.id;
  const myFavors = offers.filter((o) => o.status === "taken" && isDoer(o));
  const mySubmitted = offers.filter((o) => o.status === "submitted" && isDoer(o));

  const create = async () => {
    if (!title.trim()) return flash("Ponle un título al trato");
    setBusy("new");
    const { error } = await rpc("create_offer", { p_maker: me.id, p_pin: kid!.pin, p_kind: kind, p_title: title.trim(), p_points: pts });
    setBusy(null);
    if (error) { flash(error.message); sfx("reject"); }
    else { flash("¡Trato publicado en el mercado!"); sfx("claim"); setTitle(""); setPts(5); refresh(); }
  };
  const accept = async (o: MarketOffer) => {
    setBusy(o.id);
    const { error } = await rpc("accept_offer", { p_offer: o.id, p_taker: me.id, p_pin: kid!.pin });
    setBusy(null);
    if (error) { flash(error.message); sfx("reject"); }
    else { notifyParents("Gánate el Verano", `${me.name} aceptó un trato del mercado`); flash("¡Trato aceptado! Lo validan los jefes."); sfx("complete"); refresh(); }
  };
  const cancel = async (o: MarketOffer) => {
    setBusy(o.id);
    const { error } = await rpc("cancel_offer", { p_offer: o.id, p_maker: me.id, p_pin: kid!.pin });
    setBusy(null);
    if (error) flash(error.message); else { flash("Trato retirado"); refresh(); }
  };
  const markDone = async (o: MarketOffer) => {
    setBusy(o.id);
    const { error } = await rpc("market_done", { p_offer: o.id, p_kid: me.id, p_pin: kid!.pin });
    setBusy(null);
    if (error) { flash(error.message); sfx("reject"); } else { notifyParents("Gánate el Verano", `${me.name} hizo un favor del mercado`); flash("¡Marcado! Lo validan los jefes."); sfx("complete"); refresh(); }
  };

  // offer  = yo hago un favor y cobro  -> quien acepta PAGA
  // request= yo pago por un favor      -> quien acepta GANA
  const canAfford = (o: MarketOffer) => (o.kind === "offer" ? me.total_points >= o.points : true);

  const OfferCard = ({ o, highlight }: { o: MarketOffer; highlight?: boolean }) => {
    const maker = kidOf(o.maker_id);
    const earn = o.kind === "request"; // quien acepta gana XP
    const loading = busy === o.id;
    return (
      <Card className="p-4" style={{ borderLeft: `4px solid ${earn ? "#19D3AE" : "#FF6B5E"}`, ...(highlight ? { boxShadow: "0 14px 34px -16px rgba(255,159,69,.6)" } : {}) }}>
        <div className="flex items-center gap-3">
          {maker && <Avatar name={maker.name} color={maker.color} size={40} avatar={maker.avatar} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: earn ? "#19D3AE1a" : "#FF6B5E1a", color: earn ? "#0E9C82" : "#E05546" }}>{earn ? "🙏 Pide" : "💪 Ofrece"}</span>
              {highlight && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: "#FF9F451a", color: "#E0820F" }}><Flame size={11} /> chollo</span>}
            </div>
            <div className="font-semibold text-navy truncate mt-1">{o.title}</div>
            <div className="text-[11px] text-slate-400 font-medium">{maker?.name}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="text-right leading-none">
              <span className="text-lg font-black tabular-nums" style={{ color: earn ? "#0E9C82" : "#E05546" }}>{earn ? "+" : "−"}{o.points}</span>
              <span className="text-[10px] font-semibold text-slate-400"> XP</span>
            </div>
            <Btn variant="primary" className="text-xs py-1.5 px-3" disabled={loading || !canAfford(o)} onClick={() => accept(o)}>{canAfford(o) ? "Aceptar" : "Sin XP"}</Btn>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="pb-6 space-y-5">
      {/* HÉROE */}
      <div className="relative overflow-hidden rounded-[24px] p-5 text-white" style={{ background: "linear-gradient(135deg,#0B1F3A,#15315c)", boxShadow: "0 18px 44px -22px rgba(11,31,58,.55)" }}>
        <div className="absolute -top-10 -right-6 w-32 h-32 rounded-full pointer-events-none" style={{ background: "rgba(25,211,174,.18)", filter: "blur(8px)" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(25,211,174,.2)", color: "#19D3AE" }}><Handshake size={24} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold tracking-[.16em] uppercase text-white/55">El Mercado</div>
            <div className="text-xl font-black tracking-tight">Tratos entre hermanos</div>
          </div>
          <div className="text-right shrink-0"><div className="text-2xl font-black" style={{ color: "#19D3AE" }}>{me.total_points}</div><div className="text-[10px] text-white/55 font-semibold">TU XP</div></div>
        </div>
        <p className="relative text-white/75 text-[13px] font-medium mt-3 leading-snug">
          <b className="text-white">💪 Ofreces</b> un favor y cobras XP, o <b className="text-white">🙏 pides</b> un favor pagando XP. Quien lo hace, gana; quien lo recibe, paga. Los jefes dan el OK.
        </p>
      </div>

      {/* FAVORES QUE DEBES (al que le toca hacerlo) */}
      {(myFavors.length > 0 || mySubmitted.length > 0) && (
        <div>
          <div className="flex items-center gap-1.5 px-0.5 mb-2"><HandHeart size={14} style={{ color: "#FF6B5E" }} /><span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#FF6B5E" }}>Favores que debes</span></div>
          <div className="space-y-2.5">
            {myFavors.map((o) => {
              const other = kidOf(o.kind === "offer" ? o.taker_id : o.maker_id);
              const loading = busy === o.id;
              return (
                <Card key={o.id} className="p-4" style={{ borderLeft: "4px solid #FF6B5E" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: "#FF6B5E" }}><HandHeart size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy truncate">{o.title}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{other ? `para ${other.name}` : ""} · ganas +{o.points} XP al hacerlo</div>
                    </div>
                    <Btn variant="teal" className="text-xs py-2 px-3 flex items-center gap-1.5" disabled={loading} onClick={() => markDone(o)}><Check size={15} /> Hecho</Btn>
                  </div>
                </Card>
              );
            })}
            {mySubmitted.map((o) => (
              <Card key={o.id} className="p-3.5 flex items-center gap-3 opacity-80">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0"><Check size={18} /></div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{o.title}</div><div className="text-[11px] text-amber-600 font-medium">Hecho · esperando que los jefes validen</div></div>
                <Chip tone="amber">+{o.points} XP</Chip>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PUBLICAR */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><Plus size={16} className="text-brand" /><h3 className="font-bold text-navy tracking-tight text-sm">Publicar un trato</h3></div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setKind("offer")} className="rounded-2xl p-3 border text-left transition" style={kind === "offer" ? { borderColor: "#FF6B5E", background: "#FF6B5E0d" } : { borderColor: "#e8edf3" }}>
            <div className="flex items-center gap-1.5 font-bold text-navy text-sm"><HandHeart size={16} style={{ color: "#FF6B5E" }} /> Ofrezco</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Hago un favor y cobro XP</div>
          </button>
          <button onClick={() => setKind("request")} className="rounded-2xl p-3 border text-left transition" style={kind === "request" ? { borderColor: "#19D3AE", background: "#19D3AE0d" } : { borderColor: "#e8edf3" }}>
            <div className="flex items-center gap-1.5 font-bold text-navy text-sm"><Coins size={16} style={{ color: "#0E9C82" }} /> Pido</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Pago XP por un favor</div>
          </button>
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "offer" ? "Ej. Te hago la cama" : "Ej. Cúbreme la cocina"} className="mb-3" />
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setPts((p) => Math.max(1, p - 1))} className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-navy text-lg active:scale-90 transition">−</button>
          <div className="flex-1 text-center"><span className="text-2xl font-black text-navy tabular-nums">{pts}</span><span className="text-sm font-semibold text-slate-400"> XP</span></div>
          <button onClick={() => setPts((p) => p + 1)} className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-navy text-lg active:scale-90 transition">+</button>
        </div>
        <Btn variant="primary" className="w-full flex items-center justify-center gap-2" disabled={busy === "new"} onClick={create}>
          <Plus size={16} /> Publicar {kind === "offer" ? "oferta" : "petición"}
        </Btn>
        {kind === "request" && me.total_points < pts && <div className="text-[11px] text-red-500 font-semibold mt-2 text-center">No tienes {pts} XP para pagar este trato.</div>}
      </Card>

      {/* TABLÓN */}
      <div>
        <div className="flex items-center justify-between px-0.5 mb-2">
          <h3 className="font-bold text-navy tracking-tight">Tablón · {others.length + mineOpen.length} {others.length + mineOpen.length === 1 ? "trato" : "tratos"}</h3>
        </div>
        {others.length === 0 && mineOpen.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">Tablón vacío. ¡Sé el primero en publicar un trato!</Card>}
        <div className="space-y-2.5">
          {chollo && <OfferCard o={chollo} highlight />}
          {others.filter((o) => o.id !== chollo?.id).map((o) => <OfferCard key={o.id} o={o} />)}
          {mineOpen.map((o) => {
            const earn = o.kind === "request";
            return (
              <Card key={o.id} className="p-4" style={{ borderLeft: "4px solid #CBD5E1" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">{earn ? <Coins size={18} /> : <HandHeart size={18} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy truncate">{o.title}</div>
                    <div className="text-[11px] text-slate-400 font-medium">Tu trato · {earn ? "pagas" : "cobras"} {o.points} XP · esperando que alguien lo coja</div>
                  </div>
                  <button onClick={() => cancel(o)} disabled={busy === o.id} className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90 transition shrink-0" title="Retirar"><X size={16} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* MIS TRATOS */}
      {mine.length > 0 && (
        <div>
          <h4 className="font-bold text-navy text-sm mb-2 px-0.5">Mis tratos</h4>
          <div className="space-y-2">
            {mine.slice(0, 12).map((o) => {
              const iAmDoer = (o.kind === "offer" && o.maker_id === me.id) || (o.kind === "request" && o.taker_id === me.id);
              const other = o.maker_id === me.id ? o.taker_id : o.maker_id;
              const st = o.status;
              return (
                <Card key={o.id} className="p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iAmDoer ? "bg-teal/10 text-teal" : "bg-red-50 text-red-500"}`}>{iAmDoer ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy truncate">{o.title}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{other ? (o.maker_id === me.id ? "con " : "de ") + nameOf(other) : "en el tablón"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${iAmDoer ? "text-teal" : "text-red-500"}`}>{iAmDoer ? "+" : "−"}{o.points} XP</div>
                    <div className="text-[10px] font-semibold text-slate-400">{st === "open" ? "en tablón" : st === "taken" ? "por hacer" : st === "submitted" ? "por validar" : st === "done" ? "hecho" : st === "cancelled" ? "retirado" : "rechazado"}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
