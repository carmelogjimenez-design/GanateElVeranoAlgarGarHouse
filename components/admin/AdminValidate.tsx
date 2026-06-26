"use client";
import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { Card, Chip, Btn, Avatar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx, Assignment } from "@/lib/types";
import { Check, X, RotateCcw, ClipboardCheck, Target, Dog, Store, ShoppingBag, Gift, BookOpen, UserPlus, Image as ImageIcon, Undo2, CheckCheck, ChevronLeft } from "lucide-react";

type VItem = { id: string; color: string; body: ReactNode; approve: () => Promise<void>; reject: () => Promise<void>; approveLabel: string };
type Group = { key: string; title: string; icon: ReactNode; color: string; items: VItem[] };

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setM(mq.matches); on();
    mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

export default function AdminValidate({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const isMobile = useIsMobile();
  const kidOf = (id: string | null) => db.kids.find((k) => k.id === id);
  const asg = db.assignments.filter((a) => a.status === "pending");
  const red = db.redemptions.filter((r) => r.status === "pending");
  const gif = db.gifts.filter((g) => g.status === "pending");
  const sr = db.study_rewards.filter((r) => r.status === "pending");
  const milo = (db.milo_walks || []).filter((w) => w.status === "pending");
  const miloLive = (db.milo_walks || []).filter((w) => w.status === "in_progress");
  const market = (db.market_offers || []).filter((o) => o.status === "submitted");
  const newKids = db.kids.filter((k) => k.user_id && k.status === "pending");
  const [view, setView] = useState<"pendiente" | "historico">("pendiente");

  // ===== Cola con deshacer (estilo "Gmail undo") =====
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [undoBar, setUndoBar] = useState<{ key: string; label: string; onUndo: () => void } | null>(null);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingFns = useRef<Map<string, () => Promise<void>>>(new Map());

  useEffect(() => {
    const flushAll = () => { pendingFns.current.forEach((fn) => { fn().catch(() => {}); }); };
    window.addEventListener("beforeunload", flushAll);
    return () => {
      window.removeEventListener("beforeunload", flushAll);
      timers.current.forEach((t) => clearTimeout(t));
      pendingFns.current.forEach((fn) => { fn().catch(() => {}); });
    };
  }, []);

  const run = (ids: string[], fns: (() => Promise<void>)[], label: string) => {
    const key = ids.join("|") + ":" + Date.now();
    setLeaving((p) => new Set([...p, ...ids]));
    setTimeout(() => {
      setHidden((p) => new Set([...p, ...ids]));
      setLeaving((p) => { const n = new Set(p); ids.forEach((i) => n.delete(i)); return n; });
    }, 260);
    ids.forEach((i, idx) => pendingFns.current.set(i, fns[idx]));
    const t = setTimeout(async () => {
      for (const fn of fns) { try { await fn(); } catch { /* noop */ } }
      ids.forEach((i) => pendingFns.current.delete(i));
      timers.current.delete(key);
      setUndoBar((b) => (b && b.key === key ? null : b));
      refresh();
    }, 5000);
    timers.current.set(key, t);
    setUndoBar({
      key, label,
      onUndo: () => {
        clearTimeout(t); timers.current.delete(key);
        ids.forEach((i) => pendingFns.current.delete(i));
        setHidden((p) => { const n = new Set(p); ids.forEach((i) => n.delete(i)); return n; });
        setLeaving((p) => { const n = new Set(p); ids.forEach((i) => n.delete(i)); return n; });
        setUndoBar(null);
        flash("Acción deshecha");
      },
    });
  };

  const approveOne = (it: VItem) => run([it.id], [it.approve], it.approveLabel);
  const rejectOne = (it: VItem) => run([it.id], [it.reject], "Rechazada");
  const approveAll = (g: Group) => {
    const vis = g.items.filter((i) => !hidden.has(i.id));
    if (!vis.length) return;
    run(vis.map((i) => i.id), vis.map((i) => i.approve), `${vis.length} validadas`);
  };

  // ===== Construcción de items por grupo =====
  const photoChip = (
    <span className="absolute bottom-2 right-2 text-[11px] font-bold text-white px-2 py-1 rounded-lg bg-black/45 flex items-center gap-1"><ImageIcon size={12} /> Ver</span>
  );
  const kidRow = (kidId: string | null, title: string, sub: string, chip: ReactNode) => {
    const k = kidOf(kidId);
    return (
      <div className="flex items-center gap-3">
        {k && <Avatar name={k.name} color={k.color} size={42} avatar={k.avatar} />}
        <div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">{title}</div><div className="text-xs text-slate-400 truncate">{sub}</div></div>
        {chip}
      </div>
    );
  };
  const photoBox = (url: string | null | undefined, h = "h-52", empty = "Sin foto de evidencia") =>
    url
      ? <a href={url} target="_blank" rel="noreferrer" className="block relative mt-3"><img src={url} alt="evidencia" className={`w-full ${h} object-cover rounded-2xl`} />{photoChip}</a>
      : <div className={`w-full ${url === undefined ? "h-14" : h} rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 font-medium mt-3`}>{empty}</div>;

  const groups: Group[] = [];
  if (asg.length) groups.push({
    key: "asg", title: "Misiones para revisar", icon: <Target size={16} />, color: "#FF8A00",
    items: asg.map((a) => ({
      id: a.id, color: "#FF8A00", approveLabel: "Validada",
      approve: async () => { await rpc("approve_assignment", { p_assignment: a.id }); },
      reject: async () => { await rpc("reject_assignment", { p_assignment: a.id, p_penalty: 0 }); },
      body: <>{kidRow(a.kid_id, a.title, `${kidOf(a.kid_id)?.name || ""}${a.note ? ` · "${a.note}"` : ""}`, <Chip tone="brand">+{a.points} XP</Chip>)}{a.photo_url ? photoBox(a.photo_url) : photoBox(undefined)}</>,
    })),
  });
  if (milo.length) groups.push({
    key: "milo", title: "Paseos de Milo", icon: <Dog size={16} />, color: "#16A34A",
    items: milo.map((w) => ({
      id: w.id, color: "#16A34A", approveLabel: "Paseo validado",
      approve: async () => { await rpc("approve_milo", { p_walk: w.id }); },
      reject: async () => { await rpc("reject_milo", { p_walk: w.id }); },
      body: <>{kidRow(w.kid_id, `🐶 Paseo de Milo · ${w.minutes ?? 0} min`, kidOf(w.kid_id)?.name || "", <Chip tone="brand">+{w.points ?? 0} XP</Chip>)}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div><div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Salida</div>{w.start_photo ? <a href={w.start_photo} target="_blank" rel="noreferrer"><img src={w.start_photo} alt="salida" className="w-full h-32 object-cover rounded-xl" /></a> : <div className="w-full h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-300">sin foto</div>}</div>
          <div><div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Vuelta</div>{w.end_photo ? <a href={w.end_photo} target="_blank" rel="noreferrer"><img src={w.end_photo} alt="vuelta" className="w-full h-32 object-cover rounded-xl" /></a> : <div className="w-full h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-300">sin foto</div>}</div>
        </div></>,
    })),
  });
  if (market.length) groups.push({
    key: "market", title: "Tratos del mercado", icon: <Store size={16} />, color: "#A855F7",
    items: market.map((o) => {
      const maker = kidOf(o.maker_id), taker = kidOf(o.taker_id);
      const doer = o.kind === "offer" ? maker : taker, payer = o.kind === "offer" ? taker : maker;
      return {
        id: o.id, color: "#A855F7", approveLabel: "Trato cerrado",
        approve: async () => { await rpc("approve_market", { p_offer: o.id }); },
        reject: async () => { await rpc("reject_market", { p_offer: o.id }); },
        body: <><div className="flex items-center gap-2 mb-2"><span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={o.kind === "request" ? { background: "#19D3AE1a", color: "#0E9C82" } : { background: "#FF6B5E1a", color: "#E05546" }}>{o.kind === "request" ? "🙏 Petición" : "💪 Oferta"}</span><div className="font-bold text-navy truncate flex-1">{o.title}</div><Chip tone="brand">{o.points} XP</Chip></div>
          <div className="flex items-center gap-2 text-sm flex-wrap">{doer && <span className="flex items-center gap-1.5 font-semibold text-teal"><Avatar name={doer.name} color={doer.color} size={22} avatar={doer.avatar} />{doer.name} <span className="text-slate-400 font-medium">+{o.points}</span></span>}<span className="text-slate-300">·</span>{payer && <span className="flex items-center gap-1.5 font-semibold text-red-500"><Avatar name={payer.name} color={payer.color} size={22} avatar={payer.avatar} />{payer.name} <span className="text-slate-400 font-medium">−{o.points}</span></span>}</div></>,
      };
    }),
  });
  if (red.length) groups.push({
    key: "red", title: "Canjes de la tienda", icon: <ShoppingBag size={16} />, color: "#19D3AE",
    items: red.map((r) => ({
      id: r.id, color: "#19D3AE", approveLabel: "Canje aprobado",
      approve: async () => { await rpc("approve_redemption", { p_id: r.id }); },
      reject: async () => { await rpc("reject_redemption", { p_id: r.id }); },
      body: kidRow(r.kid_id, r.title, kidOf(r.kid_id)?.name || "", <Chip tone="teal">{r.cost} XP</Chip>),
    })),
  });
  if (gif.length) groups.push({
    key: "gift", title: "Mercado de XP", icon: <Gift size={16} />, color: "#EC4899",
    items: gif.map((g) => ({
      id: g.id, color: "#EC4899", approveLabel: "Transferencia hecha",
      approve: async () => { await rpc("approve_gift", { p_id: g.id }); },
      reject: async () => { await rpc("reject_gift", { p_id: g.id }); },
      body: <><div className="font-bold text-navy mb-1">{kidOf(g.from_kid)?.name} → {kidOf(g.to_kid)?.name} · {g.points} XP</div><div className="text-xs text-slate-400">{g.reason || "Sin motivo"}</div></>,
    })),
  });
  if (sr.length) groups.push({
    key: "sr", title: "Recompensas de estudio", icon: <BookOpen size={16} />, color: "#3B82F6",
    items: sr.map((r) => ({
      id: r.id, color: "#3B82F6", approveLabel: "Recompensa aprobada",
      approve: async () => { await rpc("approve_study_reward", { p_id: r.id }); },
      reject: async () => { await rpc("reject_study_reward", { p_id: r.id }); },
      body: kidRow(r.kid_id, `${kidOf(r.kid_id)?.name} · 1 hora de estudio`, `${Math.floor(r.seconds / 60)} min · ${r.day}`, <Chip tone="brand">+{r.points} pts</Chip>),
    })),
  });

  const visibleGroups = groups.map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(i.id)) })).filter((g) => g.items.length);
  const deck = useMemo(() => groups.flatMap((g) => g.items).filter((i) => !hidden.has(i.id)), [groups, hidden]);
  const pendingCount = asg.length + red.length + gif.length + sr.length + milo.length + market.length + newKids.length;
  const livePend = pendingCount - hidden.size;
  const nothingPending = pendingCount === 0;
  const withPhoto = asg.filter((a) => a.photo_url).length + milo.filter((w) => w.end_photo || w.start_photo).length;

  // ===== Histórico =====
  const callPlain = async (fn: string, args: Record<string, unknown>, msg: string) => { const { error } = await rpc(fn, args); flash(error ? error.message : msg); refresh(); };
  const hist = db.assignments.filter((a) => a.status === "approved" || a.status === "rejected").sort((x, y) => (y.validated_at || y.completed_at || y.created_at || "").localeCompare(x.validated_at || x.completed_at || x.created_at || "")).slice(0, 80);
  const revert = async (a: Assignment) => {
    const k = kidOf(a.kid_id);
    const p = prompt(`Anular "${a.title}" de ${k?.name || "el hijo"}.\nSe le quitan los puntos que ganó.\n\n¿Penalización EXTRA en XP? (0 = solo quitar lo ganado):`, "0");
    if (p === null) return;
    await callPlain("revert_assignment", { p_assignment: a.id, p_penalty: +(p || 0) }, "Anulada · puntos retirados");
  };
  const fecha = (a: Assignment) => new Date(a.validated_at || a.completed_at || a.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const leaveStyle = (id: string): React.CSSProperties => ({ transition: "opacity .25s ease, transform .25s ease", opacity: leaving.has(id) ? 0 : 1, transform: leaving.has(id) ? (isMobile ? "translateX(110%) rotate(4deg)" : "translateX(-14px)") : "none" });

  const Vbtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 font-bold rounded-xl py-3 text-[15px] text-white active:scale-95 transition" style={{ background: "linear-gradient(135deg,#16C79A,#0FB089)" }}><Check size={17} /> {label}</button>
  );
  const Rbtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 font-bold rounded-xl py-3 text-[15px] bg-white border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 active:scale-95 transition"><X size={16} /> Rechazar</button>
  );

  return (
    <div className="space-y-5 pb-24">
      {/* HÉROE */}
      <div className="relative overflow-hidden rounded-[26px] p-6 sm:p-7 text-white" style={{ background: nothingPending ? "linear-gradient(135deg,#16C79A,#0FB089)" : "linear-gradient(135deg,#FF6B5E 0%,#FF8A4C 55%,#FF9F45 100%)", boxShadow: nothingPending ? "0 24px 60px -24px rgba(15,176,137,.55)" : "0 24px 60px -24px rgba(255,107,94,.6)" }}>
        <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.16)", filter: "blur(6px)" }} />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,.10)", filter: "blur(8px)" }} />
        <div className="relative">
          <div className="text-[11px] font-bold tracking-[.2em] uppercase text-white/75">Validaciones</div>
          <h2 className="text-2xl sm:text-[28px] font-black tracking-tight mt-1 leading-tight">{nothingPending ? <>Todo al día <span className="align-middle">✨</span></> : <>Tienes <span className="tabular-nums">{livePend}</span> {livePend === 1 ? "cosa" : "cosas"} por validar</>}</h2>
          <p className="text-white/80 text-sm font-medium mt-1.5">{nothingPending ? "No hay nada pendiente. Reina la paz… por ahora." : "Aprueba o rechaza para que tus hijos sumen sus puntos."}</p>
          {!nothingPending && (
            <div className="flex flex-wrap items-center gap-2.5 mt-5">
              {asg.length > 0 && <HeroPill value={asg.length} label="Misiones" />}
              {milo.length > 0 && <HeroPill value={milo.length} label="Paseos" />}
              {withPhoto > 0 && <HeroPill value={withPhoto} label="Con foto" />}
              {newKids.length > 0 && <HeroPill value={newKids.length} label="Hijos nuevos" />}
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-card">
        <button onClick={() => setView("pendiente")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${view === "pendiente" ? "bg-navy text-white" : "text-navy"}`}>Pendiente{livePend > 0 ? ` · ${livePend}` : ""}</button>
        <button onClick={() => setView("historico")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${view === "historico" ? "bg-navy text-white" : "text-navy"}`}>Histórico</button>
      </div>

      {/* HISTÓRICO */}
      {view === "historico" && (
        <div className="space-y-2.5">
          {hist.length === 0 && <Card className="p-8 text-center text-slate-400 font-medium">Aún no hay nada validado.</Card>}
          {hist.map((a) => {
            const k = kidOf(a.kid_id), okd = a.status === "approved";
            return (
              <Card key={a.id} className="p-3.5" style={{ borderLeft: `4px solid ${okd ? "#16C79A" : "#CBD5E1"}` }}>
                <div className="flex items-center gap-3">{k && <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />}<div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{a.title}</div><div className="text-xs text-slate-400 truncate">{k?.name} · {fecha(a)}{a.note ? ` · "${a.note}"` : ""}</div></div>{okd ? <Chip tone="green">+{a.points} XP</Chip> : <Chip tone="slate">rechazada</Chip>}</div>
                {a.photo_url && <a href={a.photo_url} target="_blank" rel="noreferrer"><img src={a.photo_url} alt="evidencia" className="w-full h-32 object-cover rounded-xl mt-3" /></a>}
                {okd && <button onClick={() => revert(a)} className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl py-2 transition"><RotateCcw size={15} /> Anular (mintió) y quitar puntos</button>}
              </Card>
            );
          })}
        </div>
      )}

      {/* PENDIENTE · vacío */}
      {view === "pendiente" && nothingPending && miloLive.length === 0 && (
        <Card className="p-10 text-center"><div className="w-16 h-16 rounded-3xl bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3"><ClipboardCheck size={30} /></div><p className="font-bold text-navy">Bandeja vacía</p><p className="text-sm text-slate-400 font-medium mt-1">Cuando tus hijos completen algo, aterrizará aquí.</p></Card>
      )}

      {/* PENDIENTE */}
      {view === "pendiente" && !(nothingPending && miloLive.length === 0) && (
        <div className="space-y-6">
          {/* Hijos nuevos (acción especial) */}
          {newKids.length > 0 && (
            <div>
              <GroupHeader icon={<UserPlus size={16} />} title="Nuevos hijos por autorizar" count={newKids.length} color="#FF6B5E" />
              <div className="space-y-3">{newKids.map((k) => (
                <Card key={k.id} className="p-5 border-2 border-brand/30" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFFFFF)" }}>
                  <div className="flex items-center gap-3 mb-3"><Avatar name={k.name} color={k.color} size={44} avatar={k.avatar} /><div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">{k.name} quiere unirse</div><div className="text-xs text-slate-500">Elige su equipo para darle acceso</div></div></div>
                  <div className="grid grid-cols-2 gap-2">{db.teams.map((t) => (<Btn key={t.id} variant="dark" className="text-sm py-2.5 flex items-center justify-center gap-2" onClick={() => callPlain("approve_kid", { p_kid: k.id, p_team: t.id }, `¡${k.name} entra en ${t.name}!`)}><span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.name}</Btn>))}</div>
                  {db.teams.length === 0 && <p className="text-xs text-slate-400 font-medium mt-1">Crea equipos primero en la pestaña Hijos.</p>}
                </Card>
              ))}</div>
            </div>
          )}

          {/* Paseos en marcha (solo cancelar) */}
          {miloLive.length > 0 && (
            <div>
              <GroupHeader icon={<Dog size={16} />} title="Paseos en marcha" count={miloLive.length} color="#16A34A" />
              <div className="space-y-3">{miloLive.map((w) => { const k = kidOf(w.kid_id); return (
                <Card key={w.id} className="p-4" style={{ borderLeft: "5px solid #16A34A" }}>
                  <div className="flex items-center gap-3">{k && <Avatar name={k.name} color={k.color} size={40} avatar={k.avatar} />}<div className="flex-1 min-w-0"><div className="font-bold text-navy truncate">🐶 Milo de paseo · {k?.name || "?"}</div><div className="text-xs text-slate-400">Empezó {new Date(w.started_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div></div><button onClick={() => callPlain("cancel_milo", { p_walk: w.id }, "Paseo cancelado")} className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl px-3 py-2 transition"><X size={16} /> Cancelar</button></div>
                </Card>
              ); })}</div>
            </div>
          )}

          {/* ===== MÓVIL: mazo una a una ===== */}
          {isMobile && deck.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-navy tracking-tight">Revisa una a una</h3>
                <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ background: "#FF8A00" }}>Quedan {deck.length}</span>
              </div>
              <div className="relative">
                {deck.slice(0, 3).map((it, idx) => idx === 0 ? (
                  <Card key={it.id} className="p-5 overflow-hidden" style={{ borderLeft: `5px solid ${it.color}`, ...leaveStyle(it.id) }}>
                    {it.body}
                    <div className="flex gap-2 mt-4"><Rbtn onClick={() => rejectOne(it)} /><Vbtn onClick={() => approveOne(it)} label="Validar" /></div>
                  </Card>
                ) : (
                  <div key={it.id} className="absolute inset-x-0 -z-10 bg-white border border-slate-200 rounded-2xl shadow-card" style={{ top: idx * 8, height: 80, transform: `scale(${1 - idx * 0.03})`, opacity: 0.5 }} />
                ))}
              </div>
            </div>
          )}

          {/* ===== ESCRITORIO: lista + "validar todas" ===== */}
          {!isMobile && visibleGroups.map((g) => (
            <div key={g.key}>
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${g.color}1a`, color: g.color }}>{g.icon}</span>
                <h3 className="font-bold text-navy tracking-tight">{g.title}</h3>
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full tabular-nums" style={{ background: g.color }}>{g.items.length}</span>
                {g.items.length > 1 && <button onClick={() => approveAll(g)} className="ml-auto flex items-center gap-1.5 text-sm font-bold text-white px-3.5 py-2 rounded-xl active:scale-95 transition" style={{ background: "linear-gradient(135deg,#16C79A,#0FB089)" }}><CheckCheck size={16} /> Validar todas</button>}
              </div>
              <div className="space-y-3">{g.items.map((it) => (
                <Card key={it.id} className="p-4 overflow-hidden" style={{ borderLeft: `5px solid ${it.color}`, ...leaveStyle(it.id) }}>
                  {it.body}
                  <div className="flex gap-2 mt-4"><Vbtn onClick={() => approveOne(it)} label="Validar" /><Rbtn onClick={() => rejectOne(it)} /></div>
                </Card>
              ))}</div>
            </div>
          ))}

          {/* móvil: grupos sin foto que no entran en mazo se ven dentro del mazo igualmente (deck los incluye) */}
          {isMobile && deck.length === 0 && newKids.length === 0 && miloLive.length === 0 && (
            <Card className="p-10 text-center"><div className="w-16 h-16 rounded-3xl bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3"><CheckCheck size={30} /></div><p className="font-bold text-navy">¡Bandeja despejada!</p><p className="text-sm text-slate-400 font-medium mt-1">Has revisado todo lo pendiente.</p></Card>
          )}
        </div>
      )}

      {/* BARRA DESHACER */}
      {undoBar && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-navy text-white rounded-2xl pl-4 pr-2 py-2 shadow-xl animate-pop max-w-md w-full sm:w-auto">
            <Check size={18} className="text-teal shrink-0" />
            <span className="text-sm font-semibold flex-1">{undoBar.label}</span>
            <button onClick={undoBar.onUndo} className="flex items-center gap-1.5 text-sm font-bold bg-white/15 hover:bg-white/25 rounded-xl px-3 py-1.5 transition"><Undo2 size={15} /> Deshacer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupHeader({ icon, title, count, color }: { icon: ReactNode; title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1a`, color }}>{icon}</span>
      <h3 className="font-bold text-navy tracking-tight">{title}</h3>
      <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full tabular-nums" style={{ background: color }}>{count}</span>
    </div>
  );
}
function HeroPill({ value, label }: { value: number; label: string }) {
  return (<div className="rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,.15)" }}><div className="text-xl font-black tabular-nums leading-none">{value}</div><div className="text-[11px] font-semibold text-white/75 mt-1">{label}</div></div>);
}
