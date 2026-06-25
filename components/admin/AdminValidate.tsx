"use client";
import { useState } from "react";
import { Card, Chip, Btn, Section, Avatar } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import type { Ctx, Assignment } from "@/lib/types";
import { Check, X, RotateCcw } from "lucide-react";

export default function AdminValidate({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const kidOf = (id: string | null) => db.kids.find((k) => k.id === id);
  const asg = db.assignments.filter((a) => a.status === "pending");
  const red = db.redemptions.filter((r) => r.status === "pending");
  const gif = db.gifts.filter((g) => g.status === "pending");
  const sr = db.study_rewards.filter((r) => r.status === "pending");
  const milo = (db.milo_walks || []).filter((w) => w.status === "pending");
  const newKids = db.kids.filter((k) => k.user_id && k.status === "pending");
  const call = async (fn: string, args: Record<string, unknown>, msg: string) => {
    const { error } = await rpc(fn, args); flash(error ? error.message : msg); refresh();
  };
  const [view, setView] = useState<"pendiente" | "historico">("pendiente");
  const pendingCount = asg.length + red.length + gif.length + sr.length + milo.length + newKids.length;
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
  const PILL_ON = "flex-1 py-2 rounded-xl text-sm font-bold bg-navy text-white";
  const PILL_OFF = "flex-1 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-navy";
  const fecha = (a: Assignment) => new Date(a.validated_at || a.completed_at || a.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="space-y-4 pb-6">
      <div className="flex gap-2">
        <button onClick={() => setView("pendiente")} className={view === "pendiente" ? PILL_ON : PILL_OFF}>Pendiente{pendingCount > 0 ? ` · ${pendingCount}` : ""}</button>
        <button onClick={() => setView("historico")} className={view === "historico" ? PILL_ON : PILL_OFF}>Histórico</button>
      </div>

      {view === "historico" && (
        <div className="space-y-2.5">
          {hist.length === 0 && <Card className="p-8 text-center text-slate-400 font-medium">Aún no hay nada validado.</Card>}
          {hist.map((a) => {
            const k = kidOf(a.kid_id);
            const okd = a.status === "approved";
            return (
              <Card key={a.id} className="p-3.5">
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

      {view === "pendiente" && nothingPending && (
        <Card className="p-8 text-center text-slate-400 font-medium">Nada pendiente. Reina la paz… por ahora.</Card>
      )}
      {view === "pendiente" && !nothingPending && (
      <div className="space-y-5">
      {newKids.length > 0 && (
        <Section title="Nuevos hijos por autorizar">
          {newKids.map((k) => (
            <Card key={k.id} className="p-4 border-2 border-brand/30 bg-orange-50/40">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={k.name} color={k.color} size={40} avatar={k.avatar} />
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
        </Section>
      )}
      {asg.length > 0 && (
        <Section title="Misiones para revisar">
          {asg.map((a) => {
            const k = kidOf(a.kid_id);
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {k && <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />}
                  <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{a.title}</div><div className="text-xs text-slate-400">{k?.name}{a.note ? ` · "${a.note}"` : ""}</div></div>
                  <Chip tone="brand">+{a.points} XP</Chip>
                </div>
                {a.photo_url && <a href={a.photo_url} target="_blank" rel="noreferrer"><img src={a.photo_url} alt="evidencia" className="w-full h-40 object-cover rounded-xl mb-3" /></a>}
                <div className="flex gap-2">
                  <Btn variant="teal" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => call("approve_assignment", { p_assignment: a.id }, "Validada. +" + a.points + " XP")}><Check size={16} /> Validar</Btn>
                  <Btn variant="ghost" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => { const p = prompt("Penalización en XP (0 = ninguna):", "0"); call("reject_assignment", { p_assignment: a.id, p_penalty: +(p || 0) }, "Rechazada."); }}><X size={16} /> Rechazar</Btn>
                </div>
              </Card>
            );
          })}
        </Section>
      )}
      {milo.length > 0 && (
        <Section title="Paseos de Milo">
          {milo.map((w) => {
            const k = kidOf(w.kid_id);
            return (
              <Card key={w.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {k && <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />}
                  <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">🐶 Paseo de Milo · {w.minutes ?? 0} min</div><div className="text-xs text-slate-400">{k?.name}</div></div>
                  <Chip tone="brand">+{w.points ?? 0} XP</Chip>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Salida</div>{w.start_photo ? <a href={w.start_photo} target="_blank" rel="noreferrer"><img src={w.start_photo} alt="salida" className="w-full h-28 object-cover rounded-xl" /></a> : <div className="w-full h-28 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-300">sin foto</div>}</div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Vuelta</div>{w.end_photo ? <a href={w.end_photo} target="_blank" rel="noreferrer"><img src={w.end_photo} alt="vuelta" className="w-full h-28 object-cover rounded-xl" /></a> : <div className="w-full h-28 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-300">sin foto</div>}</div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="teal" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => call("approve_milo", { p_walk: w.id }, "Paseo validado · +" + (w.points ?? 0) + " XP")}><Check size={16} /> Validar</Btn>
                  <Btn variant="ghost" className="flex-1 flex items-center justify-center gap-1.5" onClick={() => call("reject_milo", { p_walk: w.id }, "Paseo rechazado")}><X size={16} /> Rechazar</Btn>
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
                  {k && <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />}
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
      {sr.length > 0 && (
        <Section title="Recompensas de estudio">
          {sr.map((r) => {
            const k = kidOf(r.kid_id);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {k && <Avatar name={k.name} color={k.color} size={36} avatar={k.avatar} />}
                  <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{k?.name} · 1 hora de estudio</div><div className="text-xs text-slate-400">{Math.floor(r.seconds / 60)} min estudiados el {r.day}</div></div>
                  <Chip tone="brand">+{r.points} pts</Chip>
                </div>
                <div className="flex gap-2">
                  <Btn variant="teal" className="flex-1" onClick={() => call("approve_study_reward", { p_id: r.id }, "Recompensa aprobada. +" + r.points + " pts")}>Aprobar</Btn>
                  <Btn variant="ghost" className="flex-1" onClick={() => call("reject_study_reward", { p_id: r.id }, "Recompensa rechazada")}>Rechazar</Btn>
                </div>
              </Card>
            );
          })}
        </Section>
      )}
      </div>
      )}
    </div>
  );
}
