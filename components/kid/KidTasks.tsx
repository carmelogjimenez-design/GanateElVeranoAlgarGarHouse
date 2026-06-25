"use client";
import { useState, useEffect } from "react";
import { Card, Chip, Btn, IconTile, Modal } from "@/components/ui/atoms";
import MiloCard from "@/components/kid/MiloCard";
import { COPY, pick } from "@/lib/copy";
import { rpc, todayStr, cooldownMs, fmtCountdown } from "@/lib/helpers";
import { notifyParents } from "@/lib/push";
import { sfx } from "@/lib/sfx";
import { sb } from "@/lib/supabase";
import { missionIcon, freqColor, FREQ_META } from "@/lib/icons";
import type { Ctx, Kid, Assignment, MarketOffer } from "@/lib/types";
import { Check, Clock, CheckCircle2, Camera, Users, Sparkles, Hand, Lock, HandHeart } from "lucide-react";

const RECOCHINEO = [
  "Se acabó el tiempo, campeón. Esos puntos volaron 🫡",
  "Tic-tac… tic-tac… ¡fuera! Te ganó el reloj ⏰",
  "Demasiado lento. Milo lo habría hecho antes 🐶",
  "El sofá ganó esta batalla. Puntos restados 🛋️",
  "Plazo agotado. La próxima, menos siesta 😴",
  "Llegaste tarde como el examen sin estudiar. Menos puntos 📉",
];

const EPIC = [
  "Sé un hijo top, ejemplar. Ponte al servicio de los demás: vivimos para morir y morimos para vivir.",
  "El que ayuda sin que se lo pidan es el verdadero crack de la casa.",
  "Pequeñas acciones, gran corazón. Hoy has sido ejemplo para tus hermanos.",
  "Haz el bien y no mires a quién. La casa entera es mejor contigo.",
  "Hoy sumaste; mañana, más. Así se forja una leyenda.",
];

export default function KidTasks({ ctx, me, asg, onTab }: { ctx: Ctx; me: Kid; asg: Assignment[]; onTab?: (t: string) => void }) {
  const { db, flash, refresh, kid } = ctx;
  const [busy, setBusy] = useState<string | null>(null);
  const [tutor, setTutor] = useState(false);
  const pending = asg.filter((a) => ["todo", "rejected"].includes(a.status) && !a.expired);
  const expired = asg.filter((a) => a.expired);
  const wait = asg.filter((a) => a.status === "pending");
  const done = asg.filter((a) => a.status === "approved");
  const today = todayStr();
  const openAsg = db.assignments.filter((a) => !a.kid_id && a.status === "open");
  const freqOf = (a: Assignment) => db.tasks.find((t) => t.id === a.task_id)?.frequency || "";
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  // Misiones congeladas: hechas y aún en cooldown (no se pueden repetir hasta que vuelvan)
  const frozenMap = new Map<string, { a: Assignment; until: number }>();
  done.forEach((a) => {
    if (!a.task_id) return;
    const cd = cooldownMs(freqOf(a));
    if (cd <= 0) return;
    const until = new Date(a.validated_at || a.completed_at || a.created_at || Date.now()).getTime() + cd;
    if (until <= now) return;
    const prev = frozenMap.get(a.task_id);
    if (!prev || until > prev.until) frozenMap.set(a.task_id, { a, until });
  });
  const frozen = [...frozenMap.values()].sort((p, q) => p.until - q.until);
  // Robo: las tareas robables se calculan siempre (para teasear); solo se pueden robar si no tienes pendientes
  const canSteal = pending.length === 0;
  const stealMap = new Map<string, { a: Assignment; team: (typeof db.teams)[number] | undefined }>();
  db.assignments.forEach((a) => {
    if (a.status !== "todo" || !a.kid_id || !a.task_id) return;
    const owner = db.kids.find((k) => k.id === a.kid_id);
    if (!owner || owner.team_id === me.team_id) return;
    const task = db.tasks.find((t) => t.id === a.task_id);
    if (!task || task.scope !== "team") return;
    const key = a.task_id + "|" + (owner.team_id || "");
    if (!stealMap.has(key)) stealMap.set(key, { a, team: db.teams.find((t) => t.id === owner.team_id) });
  });
  const stealable = [...stealMap.values()];
  const marketFavors = (db.market_offers || []).filter((o) => o.status === "taken" && (o.kind === "offer" ? o.maker_id : o.taker_id) === me.id);
  const colOf = (a: Assignment) => freqColor(db.tasks.find((t) => t.id === a.task_id)?.frequency || "");
  const mySubjects = db.subjects.filter((s) => s.kid_id === me.id);
  const [photoAsk, setPhotoAsk] = useState<Assignment | null>(null);
  const [shareAsk, setShareAsk] = useState<Assignment | null>(null);
  const isTeamMission = (a: Assignment) => { const t = db.tasks.find((x) => x.id === a.task_id); return t?.scope === "team" && !!a.team_id; };
  const [nextAsk, setNextAsk] = useState<{ kind: "mission" | "study" | "phrase"; next?: Assignment; phrase?: string } | null>(null);
  const openNext = (justDone: Assignment) => {
    const remaining = asg.filter((x) => x.id !== justDone.id && ["todo", "rejected"].includes(x.status) && !x.expired);
    if (remaining.length) setNextAsk({ kind: "mission", next: remaining[0] });
    else if (me.study_enabled && mySubjects.length) setNextAsk({ kind: "study" });
    else setNextAsk({ kind: "phrase", phrase: pick(EPIC) });
  };
  const claim = async (a: Assignment) => {
    setBusy(a.id);
    const { error } = await rpc("claim_mission", { p_assignment: a.id, p_kid: me.id, p_pin: kid!.pin });
    setBusy(null);
    if (error) flash(error.message); else { flash("¡Tuya! Ahora complétala."); sfx("claim"); refresh(); }
  };

  const steal = async (a: Assignment) => {
    setBusy(a.id);
    const { error } = await rpc("steal_assignment", { p_assignment: a.id, p_kid: me.id, p_pin: kid!.pin });
    setBusy(null);
    if (error) { flash(error.message); sfx("reject"); } else { flash("¡Tarea robada! Ahora complétala 😈"); sfx("claim"); refresh(); }
  };

  const marketDone = async (o: MarketOffer) => {
    setBusy(o.id);
    const { error } = await rpc("market_done", { p_offer: o.id, p_kid: me.id, p_pin: kid!.pin });
    setBusy(null);
    if (error) { flash(error.message); sfx("reject"); } else { flash("¡Hecho! Lo validan los jefes."); sfx("complete"); refresh(); }
  };

  const FREQ_TITLE: Record<string, string> = { diaria: "Diarias", "2/semana": "2 por semana", semanal: "Semanales", quincenal: "Quincenales", mensual: "Mensuales", personalizada: "Otras" };
  const freqOfTask = (a: Assignment) => { const fr = db.tasks.find((t) => t.id === a.task_id)?.frequency || "personalizada"; return FREQ_META[fr] ? fr : "personalizada"; };
  const renderMission = (a: Assignment) => {
    const Icon = missionIcon(a.title);
    const loading = busy === a.id;
    return (
      <Card key={a.id} className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: colOf(a) }}><Icon size={20} /></div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-navy truncate">{a.title}</div>
            {a.status === "rejected"
              ? <div className="text-xs font-medium text-red-500 mt-0.5">Rechazada · reinténtalo</div>
              : <div className="flex items-center gap-2 flex-wrap"><Chip tone="brand">+{a.points} pts</Chip>{a.photo_required && <Chip tone="amber">foto</Chip>}{a.stolen_from_team && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: "#A855F71a", color: "#A855F7" }}>😈 robada</span>}{(() => { const dl = db.tasks.find((t) => t.id === a.task_id)?.deadline_time; return dl ? <Chip tone="amber">⏰ antes de {dl.slice(0, 5)}</Chip> : null; })()}</div>}
          </div>
          {a.photo_required ? (
            <Btn variant="primary" className="text-sm py-2.5 px-3 flex items-center gap-1.5" disabled={loading} onClick={() => setPhotoAsk(a)}>
              <Camera size={16} /> Completar
            </Btn>
          ) : (
            <div className="flex items-center gap-2">
              <label className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer" title="Adjuntar foto">
                <Camera size={16} />
                <input type="file" accept="image/*" capture="environment" hidden disabled={loading}
                  onChange={(e) => e.target.files?.[0] && complete(a, e.target.files[0])} />
              </label>
              <button onClick={() => complete(a)} disabled={loading}
                className="w-9 h-9 rounded-full border-2 border-slate-200 hover:border-teal hover:bg-teal hover:text-white text-transparent flex items-center justify-center transition disabled:opacity-50"><Check size={18} /></button>
            </div>
          )}
        </div>
      </Card>
    );
  };
  const FREQ_ORDER = ["diaria", "2/semana", "semanal", "quincenal", "mensual", "personalizada"];
  const pendingGroups = FREQ_ORDER.map((f) => ({ f, items: pending.filter((a) => freqOfTask(a) === f) })).filter((g) => g.items.length > 0);

  const complete = async (a: Assignment, file?: File | null) => {
    setBusy(a.id);
    let url: string | null = null;
    if (file) {
      const path = `${me.id}/${a.id}-${Date.now()}.jpg`;
      const { error: upErr } = await sb.storage.from("evidencias").upload(path, file, { upsert: true });
      if (upErr) { flash("No se pudo subir la foto"); setBusy(null); return; }
      url = sb.storage.from("evidencias").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await rpc("mark_done", { p_assignment: a.id, p_kid: me.id, p_pin: kid!.pin, p_photo: url });
    setBusy(null);
    if (error) { flash(error.message); sfx("reject"); } else { flash(pick(COPY.done)); sfx("complete"); notifyParents("Gánate el Verano", `${me.name} ha completado: ${a.title}`); refresh(); if (isTeamMission(a)) setShareAsk(a); else openNext(a); }
  };

  const setShare = async (a: Assignment, share: boolean) => {
    setShareAsk(null);
    await rpc("set_share", { p_assignment: a.id, p_kid: me.id, p_pin: kid!.pin, p_share: share });
    flash(share ? "¡Repartido con el equipo!" : "¡Te los quedas tú!"); refresh(); openNext(a);
  };

  return (
    <div className="space-y-2.5 pb-6">
      <MiloCard ctx={ctx} me={me} />
      <div className="flex items-center justify-between px-0.5">
        <h3 className="font-bold text-navy tracking-tight">Misiones de hoy</h3>
        {me.can_tutor && <button onClick={() => setTutor(true)} className="text-sm font-semibold text-teal flex items-center gap-1"><Users size={15} /> Marcar por un hermano</button>}
      </div>

      {stealable.length > 0 && (canSteal ? (
        <div className="rounded-2xl p-3.5 text-white" style={{ background: "linear-gradient(135deg,#A855F7,#7c3aed)", boxShadow: "0 14px 34px -18px rgba(168,85,247,.7)" }}>
          <div className="flex items-center gap-3">
            <div className="text-[26px] leading-none">🥷</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[15px]">¡Modo robo DESBLOQUEADO!</div>
              <div className="text-[12px] text-white/85 font-medium">Hay <b className="text-white">{stealable.length}</b> {stealable.length === 1 ? "tarea" : "tareas"} de tus hermanos esperando. ¡Róbalas y quédate sus puntos! 😏</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-3.5" style={{ background: "linear-gradient(135deg,#FFF1E6,#FCE7F3)", border: "1px solid #A855F722" }}>
          <div className="flex items-center gap-3">
            <div className="text-[26px] leading-none">🥷</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[15px] text-navy">{pending.length === 1 ? "¡A 1 misión del modo robo!" : `A ${pending.length} misiones del modo robo`}</div>
              <div className="text-[12px] text-slate-500 font-medium">Acaba {pending.length === 1 ? "esa misión" : "tus misiones"} y podrás robar <b style={{ color: "#7c3aed" }}>{stealable.length} {stealable.length === 1 ? "tarea" : "tareas"}</b> de tus hermanos para ganar <b>puntos extra</b> 😏</div>
            </div>
          </div>
        </div>
      ))}
      {openAsg.length > 0 && (
        <div className="mb-1">
          <div className="flex items-center gap-1.5 px-0.5 mb-2"><Sparkles size={14} className="text-blue-500" /><span className="text-xs font-bold uppercase tracking-wide text-blue-500">Disponibles · las coge quien quiera</span></div>
          <div className="space-y-2.5">
            {openAsg.map((a) => {
              const Icon = missionIcon(a.title); const col = colOf(a); const loading = busy === a.id;
              return (
                <Card key={a.id} className="p-4" style={{ borderLeft: `4px solid ${col}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: col }}><Icon size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy truncate">{a.title}</div>
                      <Chip tone="brand">+{a.points} pts</Chip>
                    </div>
                    <Btn variant="primary" className="text-sm py-2 flex items-center gap-1.5" disabled={loading} onClick={() => claim(a)}><Hand size={15} /> Hacer yo</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {pending.length === 0 && openAsg.length === 0 && stealable.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">{pick(COPY.noTasks)}</Card>}

      {pendingGroups.length > 0 && (
        <div className="flex items-center gap-1.5 px-0.5 pt-1"><span className="text-xs font-bold uppercase tracking-wide text-navy/70">Tus misiones</span></div>
      )}
      {pendingGroups.map((g) => (
        <div key={g.f}>
          <div className="flex items-center gap-1.5 px-0.5 mb-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: freqColor(g.f) }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: freqColor(g.f) }}>{FREQ_TITLE[g.f] || "Otras"}</span>
            <span className="text-[11px] font-bold text-slate-300">{g.items.length}</span>
          </div>
          <div className="space-y-2.5">{g.items.map(renderMission)}</div>
        </div>
      ))}

      {stealable.length > 0 && (
        <div className="pt-1">
          <div className="rounded-2xl p-3 mb-2.5" style={canSteal ? { background: "#A855F70d", border: "1px solid #A855F733" } : { background: "#F1F5F9", border: "1px solid #e2e8f0" }}>
            <div className="flex items-center gap-1.5">
              {canSteal ? <Hand size={15} style={{ color: "#A855F7" }} /> : <Lock size={14} className="text-slate-400" />}
              <span className="text-sm font-black" style={{ color: canSteal ? "#7c3aed" : "#64748b" }}>{canSteal ? "Robar de otros equipos 🥷" : "Tareas robables · bloqueadas 🔒"}</span>
            </div>
            <div className="text-[12px] text-slate-500 font-medium mt-0.5">{canSteal ? <>Hazlas tú y <b>te quedas sus puntos</b> (a ellos no se les resta nada).</> : <>Acaba tus <b>{pending.length}</b> {pending.length === 1 ? "misión" : "misiones"} y podrás robar estas para ganar puntos extra 😏</>}</div>
          </div>
          <div className="space-y-2.5">
            {stealable.map(({ a, team }) => {
              const Icon = missionIcon(a.title); const loading = busy === a.id;
              return (
                <Card key={a.id} className={`p-4 ${canSteal ? "" : "opacity-70"}`} style={{ borderLeft: `4px solid ${canSteal ? "#A855F7" : "#CBD5E1"}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: canSteal ? "#A855F7" : "#CBD5E1" }}><Icon size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy truncate">{a.title}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <Chip tone="brand">+{a.points} pts</Chip>
                        {(() => { const fr = freqOfTask(a); return <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: freqColor(fr) }}><span className="w-2 h-2 rounded-full" style={{ background: freqColor(fr) }} />{FREQ_META[fr]?.label}</span>; })()}
                        {team && <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: team.color }} />{team.name}</span>}
                      </div>
                    </div>
                    {canSteal
                      ? <Btn variant="primary" className="text-sm py-2 flex items-center gap-1.5" disabled={loading} onClick={() => steal(a)}><Hand size={15} /> Robar</Btn>
                      : <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><Lock size={16} /></div>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {marketFavors.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 px-0.5 mb-2"><HandHeart size={14} style={{ color: "#FF6B5E" }} /><span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#FF6B5E" }}>Favores del mercado</span></div>
          <div className="space-y-2.5">
            {marketFavors.map((o) => {
              const loading = busy === o.id;
              return (
                <Card key={o.id} className="p-4" style={{ borderLeft: "4px solid #FF6B5E" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: "#FF6B5E" }}><HandHeart size={20} /></div>
                    <div className="flex-1 min-w-0"><div className="font-semibold text-navy truncate">{o.title}</div><div className="text-[11px] text-slate-400 font-medium">Favor del mercado · +{o.points} XP al hacerlo</div></div>
                    <Btn variant="teal" className="text-sm py-2 flex items-center gap-1.5" disabled={loading} onClick={() => marketDone(o)}><Check size={15} /> Hecho</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {wait.map((a) => (
        <Card key={a.id} className="p-3.5 flex items-center gap-3">
          <IconTile color="#F59E0B"><Clock size={18} /></IconTile>
          <span className="font-medium text-navy flex-1 truncate">{a.title}</span>
          <Chip tone="amber">En revisión</Chip>
        </Card>
      ))}
      {frozen.length > 0 && <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1 pt-1 flex items-center gap-1.5"><Lock size={12} /> Congeladas · vuelven solas</div>}
      {frozen.map(({ a, until }) => {
        const date = new Date(until);
        return (
          <Card key={a.id} className="p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#EEF2F7", color: "#94A3B8" }}><Lock size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy truncate">{a.title}</div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Hecha ✓ · vuelve en <span className="text-brand">{fmtCountdown(until - now)}</span></div>
            </div>
            <div className="text-right shrink-0 leading-tight">
              <div className="text-[11px] font-bold text-slate-400 tabular-nums">{date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}</div>
              <div className="text-[10px] text-slate-300 tabular-nums">{date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </Card>
        );
      })}

      {expired.map((a) => (
        <Card key={a.id} className="p-4" style={{ borderLeft: "4px solid #EF4444" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center shrink-0"><Clock size={20} /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy truncate line-through decoration-red-300">{a.title}</div>
              <div className="text-xs font-semibold text-red-500 mt-0.5">{RECOCHINEO[a.id.charCodeAt(0) % RECOCHINEO.length]}</div>
            </div>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-red-100 text-red-600 shrink-0">−{a.points} pts</span>
          </div>
        </Card>
      ))}

      {photoAsk && <PhotoReminderModal a={photoAsk} onClose={() => setPhotoAsk(null)} onComplete={(f) => complete(photoAsk, f)} />}

      {shareAsk && (
        <Modal title="¡Misión de equipo!" onClose={() => { const a = shareAsk; setShareAsk(null); if (a) openNext(a); }}>
          <p className="text-sm text-slate-500 font-medium mb-4">Has completado «{shareAsk.title}». ¿Qué haces con los <b className="text-navy">{shareAsk.points} XP</b>?</p>
          <div className="space-y-2.5">
            <button onClick={() => setShare(shareAsk, true)} className="w-full text-left rounded-2xl p-4 border-2 transition active:scale-[.99]" style={{ borderColor: "#19D3AE", background: "#19D3AE0d" }}>
              <div className="flex items-center gap-2 font-bold text-navy"><Users size={18} style={{ color: "#0E9C82" }} /> Repartir con el equipo</div>
              <div className="text-[12px] text-slate-500 font-medium mt-0.5">Cada miembro se lleva su parte. ¡Más equipo!</div>
            </button>
            <button onClick={() => setShare(shareAsk, false)} className="w-full text-left rounded-2xl p-4 border-2 transition active:scale-[.99]" style={{ borderColor: "#FF6B5E", background: "#FF6B5E0d" }}>
              <div className="flex items-center gap-2 font-bold text-navy"><Sparkles size={18} style={{ color: "#FF6B5E" }} /> Quedártelos tú</div>
              <div className="text-[12px] text-slate-500 font-medium mt-0.5">Te llevas los {shareAsk.points} XP enteros.</div>
            </button>
          </div>
        </Modal>
      )}
      {nextAsk && <NextActionModal data={nextAsk} onClose={() => setNextAsk(null)} onGoStudy={() => onTab?.("estudio")} />}
      {tutor && <TutorModal ctx={ctx} me={me} onClose={() => setTutor(false)} />}
    </div>
  );
}

function PhotoReminderModal({ a, onClose, onComplete }: { a: Assignment; onClose: () => void; onComplete: (f?: File | null) => void }) {
  return (
    <Modal title="¿Subes la foto?" onClose={onClose}>
      <p className="text-sm text-navy/60 font-medium mb-4">La misión <b className="text-navy">{a.title}</b> pide una <b className="text-navy">foto como prueba</b>. ¿Seguro que no quieres subirla? Con foto es mucho más fácil que te la validen.</p>
      <label className="w-full mb-2 bg-brand text-white font-bold rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition">
        <Camera size={17} /> Subir foto ahora
        <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { if (e.target.files?.[0]) { onComplete(e.target.files[0]); onClose(); } }} />
      </label>
      <button onClick={() => { onComplete(null); onClose(); }} className="w-full text-sm font-semibold text-slate-400 hover:text-navy py-2.5">Enviar sin foto igualmente</button>
    </Modal>
  );
}

function NextActionModal({ data, onClose, onGoStudy }: { data: { kind: "mission" | "study" | "phrase"; next?: Assignment; phrase?: string }; onClose: () => void; onGoStudy: () => void }) {
  return (
    <Modal title="¡Acción enviada!" onClose={onClose}>
      {data.kind === "mission" && (
        <div className="space-y-3">
          <p className="text-sm text-navy/70 font-medium">Aún te queda una misión obligatoria: <b className="text-navy">{data.next?.title}</b>. ¿Vas a por ella y rematas el día?</p>
          <Btn variant="primary" className="w-full" onClick={onClose}>¡Sí, vamos a por ella!</Btn>
          <button onClick={onClose} className="w-full text-sm font-semibold text-slate-400 hover:text-navy py-1.5">Ahora no</button>
        </div>
      )}
      {data.kind === "study" && (
        <div className="space-y-3">
          <p className="text-sm text-navy/70 font-medium">¡No te queda ninguna misión pendiente! ¿Aprovechas para <b className="text-navy">estudiar</b> un rato y sumar todavía más?</p>
          <Btn variant="teal" className="w-full flex items-center justify-center gap-2" onClick={() => { onGoStudy(); onClose(); }}>Ir a estudiar</Btn>
          <button onClick={onClose} className="w-full text-sm font-semibold text-slate-400 hover:text-navy py-1.5">Luego</button>
        </div>
      )}
      {data.kind === "phrase" && (
        <div className="text-center space-y-3">
          <div className="text-5xl">🌟</div>
          <p className="text-navy font-semibold leading-relaxed px-2">{data.phrase}</p>
          <Btn variant="primary" className="w-full" onClick={onClose}>¡A por todas!</Btn>
        </div>
      )}
    </Modal>
  );
}

function TutorModal({ ctx, me, onClose }: { ctx: Ctx; me: Kid; onClose: () => void }) {
  const { db, flash, refresh, kid } = ctx;
  const others = db.kids.filter((k) => k.id !== me.id);
  const mark = async (aid: string) => {
    const { error } = await rpc("tutor_mark_done", { p_tutor: me.id, p_pin: kid!.pin, p_assignment: aid });
    if (error) flash(error.message); else { flash("Marcada por ti. La validan los padres."); refresh(); onClose(); }
  };
  return (
    <Modal title="Marcar misión por un hermano" onClose={onClose}>
      <div className="space-y-4">
        {others.map((k) => {
          const todo = db.assignments.filter((a) => a.kid_id === k.id && ["todo", "rejected"].includes(a.status));
          if (!todo.length) return null;
          return (
            <div key={k.id}>
              <div className="font-semibold text-navy text-sm mb-1">{k.name}</div>
              <div className="space-y-1.5">
                {todo.map((a) => (
                  <button key={a.id} onClick={() => mark(a.id)} className="w-full flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-medium text-navy">
                    <span className="truncate">{a.title}</span><span className="text-teal font-bold">+{a.points}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {others.every((k) => !db.assignments.some((a) => a.kid_id === k.id && ["todo", "rejected"].includes(a.status))) &&
          <p className="text-slate-400 text-sm font-medium text-center py-4">No hay misiones pendientes de otros hermanos.</p>}
      </div>
    </Modal>
  );
}
