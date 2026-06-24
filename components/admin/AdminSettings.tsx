"use client";
import { useState } from "react";
import { Card, Btn, Input } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { rpc } from "@/lib/helpers";
import { enablePush } from "@/lib/push";
import AdminAccounts from "@/components/admin/AdminAccounts";
import { Bell, Camera, UserCog, Zap, X, AlertTriangle, RotateCcw } from "lucide-react";
import type { Ctx } from "@/lib/types";

export default function AdminSettings({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash, session } = ctx;
  const [pushMsg, setPushMsg] = useState("");
  const activarPush = async () => {
    const uid = (session as { user?: { id?: string } } | null)?.user?.id;
    if (!uid) { setPushMsg("Inicia sesión como padre para activar avisos."); return; }
    const r = await enablePush(uid); setPushMsg(r.msg);
  };
  const [photo, setPhoto] = useState("");
  const uploadProfile = async (file: File) => {
    const uid = (session as { user?: { id?: string } } | null)?.user?.id;
    if (!uid) { flash("Inicia sesión para subir tu foto"); return; }
    const { error } = await sb.storage.from("avatars").upload(`parent/${uid}.jpg`, file, { upsert: true });
    if (error) { flash("No se pudo subir la foto"); return; }
    const url = sb.storage.from("avatars").getPublicUrl(`parent/${uid}.jpg`).data.publicUrl + "?t=" + Date.now();
    await sb.from("profiles").update({ avatar_url: url }).eq("id", uid);
    setPhoto(url); flash("Foto de perfil actualizada");
  };
  const [ev, setEv] = useState({ title: "¡Fin de semana de Doble XP!", multiplier: 2, hours: 48 });
  const activeEvents = db.events.filter((e) => e.active && new Date(e.ends_at) > new Date());
  const createEvent = async () => {
    const ends = new Date(Date.now() + ev.hours * 3600 * 1000).toISOString();
    const { error } = await sb.from("events").insert({ title: ev.title, kind: "double_xp", multiplier: ev.multiplier, ends_at: ends });
    flash(error ? error.message : "¡Evento activado!"); refresh();
  };
  const stopEvent = async (id: string) => { await sb.from("events").update({ active: false }).eq("id", id); refresh(); };
  const s = db.settings;
  const [f, setF] = useState({
    team_goal: s?.team_goal ?? 200,
    challenge_label: s?.challenge_label ?? "Reto de equipo",
    challenge_until: s?.challenge_until ?? "",
    weekly_goal_default: s?.weekly_goal_default ?? 100,
    study_reward_points: s?.study_reward_points ?? 20,
    study_goal_min: Math.round((s?.study_goal_seconds ?? 3600) / 60),
  });
  const save = async () => {
    const { error } = await sb.from("settings").update({
      team_goal: f.team_goal, challenge_label: f.challenge_label,
      challenge_until: f.challenge_until || null, weekly_goal_default: f.weekly_goal_default,
      study_reward_points: f.study_reward_points, study_goal_seconds: f.study_goal_min * 60,
    }).eq("id", 1);
    flash(error ? error.message : "Ajustes guardados"); refresh();
  };
  const applyToAll = async () => {
    const { error } = await sb.from("kids").update({ weekly_goal: f.weekly_goal_default }).neq("id", "00000000-0000-0000-0000-000000000000");
    flash(error ? error.message : "Objetivo aplicado a todos los hijos"); refresh();
  };
  const resetAll = async () => {
    const t = prompt(
      "Esto pondrá a CERO los puntos de TODOS los hijos, borrará el historial de puntos y reseteará las misiones (las de hoy se regeneran vacías).\n\nNO afecta a: medallas, asignaturas, recompensas configuradas ni cuentas.\n\nEscribe RESETEAR para confirmar:"
    );
    if (t === null) return;
    if (t.trim().toUpperCase() !== "RESETEAR") { flash("Cancelado (no escribiste RESETEAR)"); return; }
    if (!confirm("¿Seguro del todo? Esta acción NO se puede deshacer.")) return;
    const { error } = await rpc("admin_reset_all", {});
    flash(error ? error.message : "Hecho · puntos e historial a cero y misiones reseteadas"); refresh();
  };
  return (
    <div className="max-w-2xl space-y-4 pb-6">
      <AdminAccounts />
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3"><UserCog size={16} className="text-brand" /><h3 className="font-bold text-navy tracking-tight">Tu perfil</h3></div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
            {photo ? <img src={photo} alt="perfil" className="w-full h-full object-cover" /> : <UserCog size={26} className="text-slate-300" />}
          </div>
          <div className="flex-1">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy border border-slate-200 rounded-xl px-3 py-2 cursor-pointer hover:border-brand"><Camera size={16} /> Subir foto<input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadProfile(e.target.files[0])} /></label>
            <p className="text-xs text-slate-400 font-medium mt-2">Crea o elimina hijos en la pestaña <b>Hijos</b>. Los que no tienen móvil los creas tú con PIN; los que tienen móvil podrán registrarse con su email.</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2"><Bell size={16} className="text-brand" /><h3 className="font-bold text-navy tracking-tight">Avisos push</h3></div>
        <p className="text-sm text-slate-400 font-medium">Activa las notificaciones en este dispositivo para enterarte al instante cuando un hijo complete algo que validar. En el móvil, instala antes la app (botón "Añadir a pantalla de inicio").</p>
        <Btn variant="dark" className="w-full flex items-center justify-center gap-2" onClick={activarPush}><Bell size={16} /> Activar avisos en este dispositivo</Btn>
        {pushMsg && <p className="text-sm font-semibold text-teal">{pushMsg}</p>}
      </Card>
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2"><Zap size={16} className="text-amber-500" /><h3 className="font-bold text-navy tracking-tight">Eventos · Doble XP</h3></div>
        <p className="text-sm text-slate-400 font-medium">Mientras esté activo, las misiones validadas multiplican sus puntos.</p>
        {activeEvents.map((e) => (
          <div key={e.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <div className="text-sm"><span className="font-bold text-navy">{e.title}</span><span className="text-amber-600 font-semibold"> · x{e.multiplier}</span><div className="text-xs text-slate-400">hasta {new Date(e.ends_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div></div>
            <button onClick={() => stopEvent(e.id)} className="text-slate-400 hover:text-red-400"><X size={18} /></button>
          </div>
        ))}
        <Input value={ev.title} onChange={(e2) => setEv({ ...ev, title: e2.target.value })} placeholder="Nombre del evento" />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-semibold text-navy">Multiplicador</label><Input type="number" value={ev.multiplier} onChange={(e2) => setEv({ ...ev, multiplier: +e2.target.value })} className="mt-1.5" /></div>
          <div><label className="text-sm font-semibold text-navy">Duración (horas)</label><Input type="number" value={ev.hours} onChange={(e2) => setEv({ ...ev, hours: +e2.target.value })} className="mt-1.5" /></div>
        </div>
        <Btn variant="primary" className="w-full flex items-center justify-center gap-2" onClick={createEvent}><Zap size={16} /> Activar evento</Btn>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-bold text-navy tracking-tight">Reto de equipo</h3>
        <div><label className="text-sm font-semibold text-navy">Nombre del reto</label><Input value={f.challenge_label} onChange={(e) => setF({ ...f, challenge_label: e.target.value })} className="mt-1.5" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-semibold text-navy">Meta (pts)</label><Input type="number" value={f.team_goal} onChange={(e) => setF({ ...f, team_goal: +e.target.value })} className="mt-1.5" /></div>
          <div><label className="text-sm font-semibold text-navy">Termina el</label><Input type="date" value={f.challenge_until} onChange={(e) => setF({ ...f, challenge_until: e.target.value })} className="mt-1.5" /></div>
        </div>
        <Btn variant="primary" className="w-full" onClick={save}>Guardar ajustes</Btn>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-bold text-navy tracking-tight">Estudio</h3>
        <p className="text-sm text-slate-400 font-medium">Cuando un hijo estudia el tiempo objetivo en un día, puede reclamar una recompensa que tú apruebas en "Validar".</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-semibold text-navy">Objetivo diario (min)</label><Input type="number" value={f.study_goal_min} onChange={(e) => setF({ ...f, study_goal_min: +e.target.value })} className="mt-1.5" /></div>
          <div><label className="text-sm font-semibold text-navy">Recompensa (pts)</label><Input type="number" value={f.study_reward_points} onChange={(e) => setF({ ...f, study_reward_points: +e.target.value })} className="mt-1.5" /></div>
        </div>
        <Btn variant="primary" className="w-full" onClick={save}>Guardar ajustes</Btn>
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-sm text-slate-400 font-medium">Cada hijo tiene su propia meta (editable en su ficha). Aquí puedes fijar una común y aplicarla a todos.</p>
        <div className="flex gap-2">
          <Input type="number" value={f.weekly_goal_default} onChange={(e) => setF({ ...f, weekly_goal_default: +e.target.value })} className="w-28" />
          <Btn variant="dark" className="flex-1" onClick={applyToAll}>Aplicar a todos</Btn>
        </div>
      </Card>

      <Card className="p-5 space-y-3" style={{ borderColor: "#FECACA" }}>
        <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /><h3 className="font-bold text-red-600 tracking-tight">Zona peligrosa</h3></div>
        <p className="text-sm text-slate-400 font-medium">Pone a cero los puntos de todos los hijos, borra el historial de puntos y resetea las misiones (las de hoy se regeneran vacías). Perfecto para empezar de cero una temporada nueva. <b className="text-navy">No afecta</b> a medallas, asignaturas, recompensas ni cuentas. No se puede deshacer.</p>
        <Btn variant="danger" className="w-full flex items-center justify-center gap-2" onClick={resetAll}><RotateCcw size={16} /> Resetear puntos y misiones de todos</Btn>
      </Card>
    </div>
  );
}
