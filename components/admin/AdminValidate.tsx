"use client";
import { useState } from "react";
import { Card, Chip, Btn, Avatar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx, Assignment } from "@/lib/types";
import { Check, X, RotateCcw, ClipboardCheck, Target, Dog, Store, ShoppingBag, Gift, BookOpen, UserPlus, Image as ImageIcon } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  asg: "#FF8A00", milo: "#16A34A", market: "#A855F7", red: "#19D3AE", gift: "#EC4899", sr: "#3B82F6", kids: "#FF6B5E",
};

function GroupHeader({ icon, title, count, color }: { icon: React.ReactNode; title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1a`, color }}>{icon}</span>
      <h3 className="font-bold text-navy tracking-tight">{title}</h3>
      <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full tabular-nums" style={{ background: color }}>{count}</span>
    </div>
  );
}

export default function AdminValidate({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const kidOf = (id: string | null) => db.kids.find((k) => k.id === id);
  const asg = db.assignments.filter((a) => a.status === "pending");
  const red = db.redemptions.filter((r) => r.status === "pending");
  const gif = db.gifts.filter((g) => g.status === "pending");
  const sr = db.study_rewards.filter((r) => r.status === "pending");
  const milo = (db.milo_walks || []).filter((w) => w.status === "pending");
  const miloLive = (db.milo_walks || []).filter((w) => w.status === "in_progress");
  const market = (db.market_offers || []).filter((o) => o.status === "submitted");
  const newKids = db.kids.filter((k) => k.user_id && k.status === "pending");
  const call = async (fn: string, args: Record<string, unknown>, msg: string) => {
    const { error } = await rpc(fn, args); flash(error ? error.message : msg); refresh();
  };
  const [view, setView] = useState<"pendiente" | "historico">("pendiente");
  const pendingCount = asg.length + red.length + gif.length + sr.length + milo.length + market.length + newKids.length;
  const withPhoto = asg.filter((a) => a.photo_url).length + milo.filter((w) => w.end_photo || w.start_photo).length;
  const nothingPending = pendingCount === 0;
  const hist = db.assignments
    .filter((a) => a.status === "approved" || a.status === "rejected")
    .sort((x, y) => (y.validated_at || y.completed_at || y.created_at || "").localeCompare(x.validated_at || x.completed_at || x.created_at || ""))
    .slice(0, 80);
  const revert = async (a: Assignment) => {
    const k = kidOf(a.kid_id);
    const p = prompt(`Anular "${a.title}" de ${k?.name || "el hijo"}.\nSe le quitan los puntos que ganó.\n\n¿Penalización EXTRA en XP? (0 = solo quitar lo ganado):`, "0");
    if (p === null) return;
    await call("revert_assignment", { p_assignment: a.id, p_penalty: +(p || 0) }, "Anulada · puntos retirados");
  };
  const fecha = (a: Assignment) => new Date(a.validated_at || a.completed_at || a.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const VBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 font-bold rounded-xl py-3 text-[15px] text-white active:scale-95 transition" style={{ background: "linear-gradient(135deg,#16C79A,#0FB089)" }}>{children}</button>
  );
  const RBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 font-bold rounded-xl py-3 text-[15px] bg-white border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 active:scale-95 transition"><X size={16} /> Rechazar</button>
  );

  return (
    <div className="space-y-5 pb-6">
      {/* ===== HÉROE ===== */}
      <div className="relative overflow-hidden rounded-[26px] p-6 sm:p-7 text-white" style={{ background: nothingPending ? "linear-gradient(135deg,#16C79A 0%,#0FB089 100%)" : "linear-gradient(135deg,#FF6B5E 0%,#FF8A4C 55%,#FF9F45 100%)", boxShadow: nothingPending ? "0 24px 60px -24px rgba(15,176,137,.55)" : "0 24px 60px -24px rgba(255,107,94,.6)" }}>
        <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.16)", filter: "blur(6px)" }} />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.10)", filter: "blur(8px)" }} />
        <div className="relative">
          <div className="text-[11px] font-bold tracking-[.2em] uppercase text-white/75">Validaciones</div>
          <h2 className="text-2xl sm:text-[28px] font-black tracking-tight mt-1 leading-tight">
            {nothingPending ? <>Todo al día <span className="align-middle">✨</span></> : <>Tienes <span className="tabular-nums">{pendingCount}</span> {pendingCount === 1 ? "cosa" : "cosas"} por validar</>}
          </h2>
          <p className="text-white/80 text-sm font-medium mt-1.5">{nothingPending ? "No hay nada pendiente. Reina la paz… por ahora." : "Aprueba o rechaza para que tus hijos sumen sus puntos."}</p>
          {!nothingPending && (
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              {asg.length > 0 && <HeroPill value={asg.length} label="Misiones" />}
              {milo.length > 0 && <HeroPill value={milo.length} label="Paseos" />}
              {withPhoto > 0 && <HeroPill value={withPhoto} label="Con foto" />}
              {(red.length + gif.length + sr.length + market.length) > 0 && <HeroPill value={red.length + gif.length + sr.length + market.length} label="Tienda y mercado" />}
              {newKids.length > 0 && <HeroPill value={newKids.length} label="Hijos nuevos" />}
            </div>
          )}
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-card">
        <button onClick={() => setView("pendiente")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${view === "pendiente" ? "bg-navy text-white" : "text-navy"}`}>Pendiente{pendingCount > 0 ? ` · ${pendingCount}` : ""}</button>
        <button onClick={() => setView("historico")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${view === "historico" ? "bg-navy text-white" : "text-navy"}`}>Histórico</button>
      </div>

      {/* ===== HISTÓRICO ===== */}
      {view === "historico" && (
        <div className="space-y-2.5">
          {hist.length === 0 && <Card className="p-8 text-center text-slate-400 font-medium">Aún no hay nada validado.</Card>}
          {hist.map((a) => {
            const k = kidOf(a.kid_id);
            const okd = a.status === "approved";
            return (
              <Card key={a.id} className="p-3.5" style={{ borderLeft: `4px solid ${okd ? "#16C79A" : "#CBD5E1"}` }}>
                <div className="flex items-center gap-3">
                  {k && <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy truncate">{a.title}</div>
                    <div className="text-xs text-slate-400 truncate">{k?.name} · {fecha(a)}{a.note ? ` · "${a.note}"` : ""}</div>
                  </div>
                  {okd ? <Chip tone="green">+{a.points} XP</Chip> : <Chip tone="slate">rechazada</Chip>}
                </div>
                {a.photo_url && <a href={a.photo_url} target="_blank" rel="noreferrer"><img src={a.photo_url} alt="evidencia" className="w-full h-32 object-cover rounded-xl mt-3" /></a>}
                {okd && (
                  <button onClick={() => revert(a)} className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl py-2 transition">
                    <RotateCcw size={15} /> Anular (mintió) y quitar puntos
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {view === "pendiente" && nothingPending && miloLive.length === 0 && (
        <Card className="p-10 text-center"><div className="w-16 h-16 rounded-3xl bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3"><ClipboardCheck size={30} /></div><p className="font-bold text-navy">Bandeja vacía</p><p className="text-sm text-slate-400 font-medium mt-1">Cuando tus hijos completen algo, aterrizará aquí.</p></Card>
      )}

      {view === "pendiente" && !(nothingPending && miloLive.length === 0) && (
        <div className="space-y-6">
          {newKids.length > 0 && (
            <div>
              <GroupHeader icon={<UserPlus size={16} />} title="Nuevos hijos por autorizar" count={newKids.length} color={TYPE_COLOR.kids} />
              <div className="space-y-3">
                {newKids.map((k) => (
                  <Card key={k.id} className="p-5 border-2 border-brand/30" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFFFFF)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={k.name} color={k.color} size={44} avatar={k.avatar} />
                      <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">{k.name} quiere unirse</div><div className="text-xs text-slate-500">Elige su equipo para darle acceso</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {db.teams.map((t) => (
                        <Btn key={t.id} variant="dark" className="text-sm py-2.5 flex items-center justify-center gap-2" onClick={() => call("approve_kid", { p_kid: k.id, p_team: t.id }, `¡${k.name} entra en ${t.name}!`)}>
                          <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.name}
                        </Btn>
                      ))}
                    </div>
                    {db.teams.length === 0 && <p className="text-xs text-slate-400 font-medium mt-1">Crea equipos primero en la pestaña Hijos.</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {asg.length > 0 && (
            <div>
              <GroupHeader icon={<Target size={16} />} title="Misiones para revisar" count={asg.length} color={TYPE_COLOR.asg} />
              <div className="space-y-3">
                {asg.map((a) => {
                  const k = kidOf(a.kid_id);
                  return (
                    <Card key={a.id} className="p-4 overflow-hidden" style={{ borderLeft: `5px solid ${TYPE_COLOR.asg}` }}>
                      <div className="flex items-center gap-3 mb-3">
                        {k && <Avatar name={k.name} color={k.color} size={42} avatar={k.avatar} />}
                        <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">{a.title}</div><div className="text-xs text-slate-400">{k?.name}{a.note ? ` · "${a.note}"` : ""}</div></div>
                        <Chip tone="brand">+{a.points} XP</Chip>
                      </div>
                      {a.photo_url
                        ? <a href={a.photo_url} target="_blank" rel="noreferrer" className="block relative group"><img src={a.photo_url} alt="evidencia" className="w-full h-48 object-cover rounded-2xl mb-3" /><span className="absolute bottom-5 right-3 text-[11px] font-bold text-white px-2 py-1 rounded-lg bg-black/40 flex items-center gap-1"><ImageIcon size={12} /> Ver foto</span></a>
                        : <div className="w-full h-16 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 font-medium mb-3">Sin foto de evidencia</div>}
                      <div className="flex gap-2">
                        <VBtn onClick={() => call("approve_assignment", { p_assignment: a.id }, "Validada. +" + a.points + " XP")}><Check size={16} /> Validar</VBtn>
                        <RBtn onClick={() => { const p = prompt("Penalización en XP (0 = ninguna):", "0"); call("reject_assignment", { p_assignment: a.id, p_penalty: +(p || 0) }, "Rechazada."); }} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {miloLive.length > 0 && (
            <div>
              <GroupHeader icon={<Dog size={16} />} title="Paseos en marcha" count={miloLive.length} color={TYPE_COLOR.milo} />
              <div className="space-y-3">
                {miloLive.map((w) => {
                  const k = kidOf(w.kid_id);
                  return (
                    <Card key={w.id} className="p-4" style={{ borderLeft: `5px solid ${TYPE_COLOR.milo}` }}>
                      <div className="flex items-center gap-3">
                        {k && <Avatar name={k.name} color={k.color} size={40} avatar={k.avatar} />}
                        <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">🐶 Milo de paseo · {k?.name || "?"}</div><div className="text-xs text-slate-400">Empezó {new Date(w.started_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div></div>
                        <button onClick={() => call("cancel_milo", { p_walk: w.id }, "Paseo cancelado")} className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl px-3 py-2 transition"><X size={16} /> Cancelar</button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {milo.length > 0 && (
            <div>
              <GroupHeader icon={<Dog size={16} />} title="Paseos de Milo" count={milo.length} color={TYPE_COLOR.milo} />
              <div className="space-y-3">
                {milo.map((w) => {
                  const k = kidOf(w.kid_id);
                  return (
                    <Card key={w.id} className="p-4" style={{ borderLeft: `5px solid ${TYPE_COLOR.milo}` }}>
                      <div className="flex items-center gap-3 mb-3">
                        {k && <Avatar name={k.name} color={k.color} size={42} avatar={k.avatar} />}
                        <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">🐶 Paseo de Milo · {w.minutes ?? 0} min</div><div className="text-xs text-slate-400">{k?.name}</div></div>
                        <Chip tone="brand">+{w.points ?? 0} XP</Chip>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div><div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Salida</div>{w.start_photo ? <a href={w.start_photo} target="_blank" rel="noreferrer"><img src={w.start_photo} alt="salida" className="w-full h-32 object-cover rounded-xl" /></a> : <div className="w-full h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-300">sin foto</div>}</div>
                        <div><div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Vuelta</div>{w.end_photo ? <a href={w.end_photo} target="_blank" rel="noreferrer"><img src={w.end_photo} alt="vuelta" className="w-full h-32 object-cover rounded-xl" /></a> : <div className="w-full h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-300">sin foto</div>}</div>
                      </div>
                      <div className="flex gap-2">
                        <VBtn onClick={() => call("approve_milo", { p_walk: w.id }, "Paseo validado · +" + (w.points ?? 0) + " XP")}><Check size={16} /> Validar</VBtn>
                        <RBtn onClick={() => call("reject_milo", { p_walk: w.id }, "Paseo rechazado")} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {market.length > 0 && (
            <div>
              <GroupHeader icon={<Store size={16} />} title="Tratos del mercado" count={market.length} color={TYPE_COLOR.market} />
              <div className="space-y-3">
                {market.map((o) => {
                  const maker = kidOf(o.maker_id); const taker = kidOf(o.taker_id);
                  const doer = o.kind === "offer" ? maker : taker;
                  const payer = o.kind === "offer" ? taker : maker;
                  return (
                    <Card key={o.id} className="p-4" style={{ borderLeft: `5px solid ${TYPE_COLOR.market}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={o.kind === "request" ? { background: "#19D3AE1a", color: "#0E9C82" } : { background: "#FF6B5E1a", color: "#E05546" }}>{o.kind === "request" ? "🙏 Petición" : "💪 Oferta"}</span>
                        <div className="font-bold text-navy truncate flex-1">{o.title}</div>
                        <Chip tone="brand">{o.points} XP</Chip>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
                        {doer && <span className="flex items-center gap-1.5 font-semibold text-teal"><Avatar name={doer.name} color={doer.color} size={22} avatar={doer.avatar} />{doer.name} <span className="text-slate-400 font-medium">hace y gana +{o.points}</span></span>}
                        <span className="text-slate-300">·</span>
                        {payer && <span className="flex items-center gap-1.5 font-semibold text-red-500"><Avatar name={payer.name} color={payer.color} size={22} avatar={payer.avatar} />{payer.name} <span className="text-slate-400 font-medium">paga −{o.points}</span></span>}
                      </div>
                      <div className="flex gap-2">
                        <VBtn onClick={() => call("approve_market", { p_offer: o.id }, "Trato cerrado · puntos movidos")}><Check size={16} /> Validar</VBtn>
                        <RBtn onClick={() => call("reject_market", { p_offer: o.id }, "Trato devuelto al tablón")} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {red.length > 0 && (
            <div>
              <GroupHeader icon={<ShoppingBag size={16} />} title="Canjes de la tienda" count={red.length} color={TYPE_COLOR.red} />
              <div className="space-y-3">
                {red.map((r) => {
                  const k = kidOf(r.kid_id);
                  return (
                    <Card key={r.id} className="p-4" style={{ borderLeft: `5px solid ${TYPE_COLOR.red}` }}>
                      <div className="flex items-center gap-3 mb-3">
                        {k && <Avatar name={k.name} color={k.color} size={40} avatar={k.avatar} />}
                        <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">{r.title}</div><div className="text-xs text-slate-400">{k?.name}</div></div>
                        <Chip tone="teal">{r.cost} XP</Chip>
                      </div>
                      <div className="flex gap-2">
                        <VBtn onClick={() => call("approve_redemption", { p_id: r.id }, "Canje aprobado")}><Check size={16} /> Aprobar</VBtn>
                        <RBtn onClick={() => call("reject_redemption", { p_id: r.id }, "Canje rechazado")} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {gif.length > 0 && (
            <div>
              <GroupHeader icon={<Gift size={16} />} title="Mercado de XP" count={gif.length} color={TYPE_COLOR.gift} />
              <div className="space-y-3">
                {gif.map((g) => (
                  <Card key={g.id} className="p-4" style={{ borderLeft: `5px solid ${TYPE_COLOR.gift}` }}>
                    <div className="font-bold text-navy mb-1">{kidOf(g.from_kid)?.name} → {kidOf(g.to_kid)?.name} · {g.points} XP</div>
                    <div className="text-xs text-slate-400 mb-3">{g.reason || "Sin motivo"}</div>
                    <div className="flex gap-2">
                      <VBtn onClick={() => call("approve_gift", { p_id: g.id }, "Transferencia hecha")}><Check size={16} /> Aprobar</VBtn>
                      <RBtn onClick={() => call("reject_gift", { p_id: g.id }, "Transferencia rechazada")} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {sr.length > 0 && (
            <div>
              <GroupHeader icon={<BookOpen size={16} />} title="Recompensas de estudio" count={sr.length} color={TYPE_COLOR.sr} />
              <div className="space-y-3">
                {sr.map((r) => {
                  const k = kidOf(r.kid_id);
                  return (
                    <Card key={r.id} className="p-4" style={{ borderLeft: `5px solid ${TYPE_COLOR.sr}` }}>
                      <div className="flex items-center gap-3 mb-3">
                        {k && <Avatar name={k.name} color={k.color} size={40} avatar={k.avatar} />}
                        <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">{k?.name} · 1 hora de estudio</div><div className="text-xs text-slate-400">{Math.floor(r.seconds / 60)} min estudiados el {r.day}</div></div>
                        <Chip tone="brand">+{r.points} pts</Chip>
                      </div>
                      <div className="flex gap-2">
                        <VBtn onClick={() => call("approve_study_reward", { p_id: r.id }, "Recompensa aprobada. +" + r.points + " pts")}><Check size={16} /> Aprobar</VBtn>
                        <RBtn onClick={() => call("reject_study_reward", { p_id: r.id }, "Recompensa rechazada")} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HeroPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,.15)" }}>
      <div className="text-xl font-black tabular-nums leading-none">{value}</div>
      <div className="text-[11px] font-semibold text-white/75 mt-1">{label}</div>
    </div>
  );
}
