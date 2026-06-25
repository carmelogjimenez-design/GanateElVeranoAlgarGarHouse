"use client";
import { useState, useEffect } from "react";
import { Card, Chip, Btn, IconTile, Modal } from "@/components/ui/atoms";
import MiloCard from "@/components/kid/MiloCard";
import { COPY, pick } from "@/lib/copy";
import { rpc, todayStr, cooldownMs, fmtCountdown } from "@/lib/helpers";
import { notifyParents } from "@/lib/push";
import { sfx } from "@/lib/sfx";
import { sb } from "@/lib/supabase";
import { missionIcon, freqColor } from "@/lib/icons";
import type { Ctx, Kid, Assignment } from "@/lib/types";
import { Check, Clock, CheckCircle2, Camera, Users, Sparkles, Hand, Lock } from "lucide-react";

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
  // Robo: solo si el hijo no tiene tareas propias pendientes (todo/rejected)
  const canSteal = pending.length === 0;
  const stealMap = new Map<string, { a: Assignment; team: (typeof db.teams)[number] | undefined }>();
  if (canSteal) db.assignments.forEach((a) => {
    if (a.status !== "todo" || !a.kid_id || !a.task_id) return;
    const owner = db.kids.find((k) => k.id === a.kid_id);
    if (!owner || owner.team_id === me.team_id) return;
    const task = db.tasks.find((t) => t.id === a.task_id);
    if (!task || task.scope !== "team") return;
    const key = a.task_id + "|" + (owner.team_id || "");
    if (!stealMap.has(key)) stealMap.set(key, { a, team: db.teams.find((t) => t.id === owner.team_id) });
  });
  const stealable = [...stealMap.values()];
  const colOf = (a: Assignment) => freqColor(db.tasks.find((t) => t.id === a.task_id)?.frequency || "");
  const mySubjects = db.subjects.filter((s) => s.kid_id === me.id);
  const [photoAsk, setPhotoAsk] = useState<Assignment | null>(null);
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
    if (error) { flash(error.message); sfx("reject"); } else { flash(pick(COPY.done)); sfx("complete"); notifyParents("Gánate el Verano", `${me.name} ha completado: ${a.title}`); refresh(); openNext(a); }
  };

  return (
    <div className="space-y-2.5 pb-6">
      <MiloCard ctx={ctx} me={me} />
      <div className="flex items-center justify-between px-0.5">
        <h3 className="font-bold text-navy tracking-tight">Misiones de hoy</h3>
        {me.can_tutor && <button onClick={() => setTutor(true)} className="text-sm font-semibold text-teal flex items-center gap-1"><Users size={15} /> Marcar por un hermano</button>}
      </div>
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

      {canSteal && stealable.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 px-0.5 mb-2"><Hand size={14} style={{ color: "#A855F7" }} /><span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A855F7" }}>Roba a otros equipos · ya acabaste las tuyas</span></div>
          <div className="space-y-2.5">
            {stealable.map(({ a, team }) => {
              const Icon = missionIcon(a.title); const loading = busy === a.id;
              return (
                <Card key={a.id} className="p-4" style={{ borderLeft: "4px solid #A855F7" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: "#A855F7" }}><Icon size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy truncate">{a.title}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <Chip tone="brand">+{a.points} pts</Chip>
                        {team && <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: team.color }} />{team.name}</span>}
                      </div>
                    </div>
                    <Btn variant="primary" className="text-sm py-2 flex items-center gap-1.5" disabled={loading} onClick={() => steal(a)}><Hand size={15} /> Robar</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {pending.map((a) => {
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
      })}
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
