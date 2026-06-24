"use client";
import { useState } from "react";
import { Card, Btn, Modal, Input, Chip, IconTile } from "@/components/ui/atoms";
import { sb } from "@/lib/supabase";
import { rpc, todayStr } from "@/lib/helpers";
import { missionIcon } from "@/lib/icons";
import type { Ctx, Task } from "@/lib/types";
import { Plus, Trash2, Repeat, CalendarClock } from "lucide-react";

function AssignModal({ ctx, task, onClose }: { ctx: Ctx; task: Task; onClose: () => void }) {
  const { db, refresh, flash } = ctx;
  const [sel, setSel] = useState<string[]>([]);
  const [due, setDue] = useState(todayStr());
  const [grupal, setGrupal] = useState(false);
  const [team, setTeam] = useState("");
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const assign = async () => {
    if (grupal) {
      const members = db.kids.filter((k) => k.team_id === team && k.active);
      if (!team || !members.length) { flash("Elige un equipo con miembros"); return; }
      const gid = crypto.randomUUID();
      const rows = members.map((k) => ({ task_id: task.id, kid_id: k.id, title: task.title, points: task.points, photo_required: task.photo_required, due_date: due, team_id: team, group_id: gid, grupal: true }));
      const { error } = await sb.from("assignments").insert(rows);
      flash(error ? error.message : `Misión de equipo asignada · suma a ${rows.length}`);
      if (!error) { refresh(); onClose(); }
      return;
    }
    const rows = sel.map((kid_id) => ({ task_id: task.id, kid_id, title: task.title, points: task.points, photo_required: task.photo_required, due_date: due, team_id: db.kids.find((k) => k.id === kid_id)?.team_id ?? null }));
    const { error } = await sb.from("assignments").insert(rows);
    flash(error ? error.message : `Asignada a ${rows.length} hijo(s)`);
    if (!error) { refresh(); onClose(); }
  };
  return (
    <Modal title={`Asignar: ${task.title}`} onClose={onClose}>
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mb-3" />
      <label className="flex items-center gap-2 text-sm font-medium text-navy mb-3 bg-slate-50 rounded-xl px-3 py-2.5">
        <input type="checkbox" checked={grupal} onChange={(e) => setGrupal(e.target.checked)} className="accent-brand w-4 h-4" />
        Misión de equipo (al validarla suma a todo el equipo)
      </label>
      {grupal ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {db.teams.map((t) => {
              const n = db.kids.filter((k) => k.team_id === t.id && k.active).length;
              return <button key={t.id} onClick={() => setTeam(t.id)} className={`rounded-xl p-3 text-sm font-semibold border text-left ${team === t.id ? "border-brand bg-orange-50 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: t.color }} />{t.name}</span><span className="text-xs text-slate-400">{n} miembros</span></button>;
            })}
          </div>
          <Btn variant="primary" className="w-full" onClick={assign}>Asignar al equipo</Btn>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {db.teams.map((t) => <button key={t.id} onClick={() => { const ids = db.kids.filter((k) => k.team_id === t.id).map((k) => k.id); setSel((s) => [...new Set([...s, ...ids])]); }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white" style={{ background: t.color }}>+ {t.name}</button>)}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {db.kids.map((k) => <button key={k.id} onClick={() => toggle(k.id)} className={`rounded-xl p-2 text-sm font-semibold border ${sel.includes(k.id) ? "border-brand bg-orange-50 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{k.name}</button>)}
          </div>
          <Btn variant="primary" className="w-full" onClick={() => sel.length && assign()}>Asignar a {sel.length}</Btn>
        </>
      )}
    </Modal>
  );
}

function RecurringModal({ ctx, task, onClose }: { ctx: Ctx; task: Task; onClose: () => void }) {
  const { db, refresh, flash } = ctx;
  const targetIds = db.task_targets.filter((tt) => tt.task_id === task.id).map((tt) => tt.kid_id);
  const toggle = async (kidId: string) => {
    const existing = db.task_targets.find((tt) => tt.task_id === task.id && tt.kid_id === kidId);
    if (existing) await sb.from("task_targets").delete().eq("id", existing.id);
    else await sb.from("task_targets").insert({ task_id: task.id, kid_id: kidId });
    refresh();
  };
  return (
    <Modal title={`Recurrente: ${task.title}`} onClose={onClose}>
      <div className="bg-slate-50 rounded-xl p-3 mb-3 text-sm text-slate-500 font-medium flex items-center gap-2"><CalendarClock size={18} className="text-brand shrink-0" /> Se generará sola según su frecuencia (<b>{task.frequency}</b>) para los hijos marcados.</div>
      <div className="grid grid-cols-3 gap-2">
        {db.kids.map((k) => {
          const on = targetIds.includes(k.id);
          return <button key={k.id} onClick={() => toggle(k.id)} className={`rounded-xl p-2 text-sm font-semibold border ${on ? "border-teal bg-teal/10 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{k.name}</button>;
        })}
      </div>
      <Btn variant="teal" className="w-full mt-4" onClick={onClose}>Hecho</Btn>
    </Modal>
  );
}

export default function AdminTasks({ ctx }: { ctx: Ctx }) {
  const { db, refresh, flash } = ctx;
  const [f, setF] = useState({ title: "", description: "", points: 20, difficulty: "media", frequency: "diaria", photo_required: false });
  const [asgTask, setAsgTask] = useState<Task | null>(null);
  const [recTask, setRecTask] = useState<Task | null>(null);
  const create = async () => {
    if (!f.title) return;
    const { error } = await sb.from("tasks").insert(f);
    flash(error ? error.message : "Misión creada");
    if (!error) { setF({ ...f, title: "", description: "" }); refresh(); }
  };
  const generate = async () => {
    const { data, error } = await rpc("generate_missions", { p_date: todayStr() });
    flash(error ? error.message : `${data ?? 0} misiones generadas para hoy`); refresh();
  };
  const savePoints = async (id: string, points: number) => {
    if (!Number.isFinite(points) || points < 0) return;
    await sb.from("tasks").update({ points }).eq("id", id);
    flash("Puntos actualizados"); refresh();
  };
  return (
    <div className="pb-6">
      <Card className="p-4 space-y-2.5 mb-4">
        <h3 className="font-bold text-navy tracking-tight">Nueva misión</h3>
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título (ej. Conquista la cocina)" />
        <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Descripción" />
        <div className="flex gap-2">
          <Input type="number" value={f.points} onChange={(e) => setF({ ...f, points: +e.target.value })} className="w-24" placeholder="pts" />
          <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-2 py-3 text-[15px]"><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select>
          <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })} className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-2 py-3 text-[15px]">{["diaria", "2/semana", "semanal", "quincenal", "mensual", "personalizada"].map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy"><input type="checkbox" checked={f.photo_required} onChange={(e) => setF({ ...f, photo_required: e.target.checked })} className="accent-brand w-4 h-4" /> Requiere foto de evidencia</label>
        <Btn variant="primary" className="w-full flex items-center justify-center gap-1.5" onClick={create}><Plus size={17} /> Crear misión</Btn>
      </Card>

      <div className="flex items-center justify-between mb-3 px-0.5">
        <h3 className="font-bold text-navy tracking-tight">Catálogo de misiones ({db.tasks.length})</h3>
        <Btn variant="teal" className="text-sm py-2 flex items-center gap-1.5" onClick={generate}><CalendarClock size={15} /> Generar hoy</Btn>
      </div>
      {([["diaria", "Diarias"], ["2/semana", "2 por semana"], ["semanal", "Semanales"], ["quincenal", "Quincenales"], ["mensual", "Mensuales"], ["personalizada", "Personalizadas"]] as const).map(([freq, label]) => {
        const group = db.tasks.filter((t) => t.frequency === freq);
        if (!group.length) return null;
        return (
          <div key={freq} className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-0.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span><span className="text-xs font-semibold text-slate-300">· {group.length}</span></div>
            <div className="space-y-2.5">
              {group.map((t) => {
                const Icon = missionIcon(t.title);
                const targets = db.task_targets.filter((tt) => tt.task_id === t.id).length;
                const diffColor = t.difficulty === "dificil" ? "#EF4444" : t.difficulty === "media" ? "#FF8A00" : "#22C55E";
                return (
                  <Card key={t.id} className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: diffColor }}><Icon size={22} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-navy truncate">{t.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg pl-1.5 pr-1 py-0.5">
                            <span className="text-brand font-bold text-xs">+</span>
                            <input type="number" defaultValue={t.points} onBlur={(e) => savePoints(t.id, +e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className="w-10 bg-transparent text-brand font-bold text-sm text-center outline-none" />
                            <span className="text-brand font-bold text-xs">XP</span>
                          </div>
                          {t.photo_required && <Chip tone="amber">foto</Chip>}
                          {targets > 0 && <Chip tone="teal">recurrente · {targets}</Chip>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Btn variant="ghost" className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setRecTask(t)}><Repeat size={15} /> Recurrente</Btn>
                      <Btn variant="primary" className="flex-1 text-sm py-2" onClick={() => setAsgTask(t)}>Asignar</Btn>
                      <button onClick={async () => { if (confirm(`¿Eliminar "${t.title}"?`)) { await sb.from("tasks").delete().eq("id", t.id); refresh(); } }} className="text-slate-300 hover:text-red-400 px-2"><Trash2 size={17} /></button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      {db.tasks.length === 0 && <Card className="p-6 text-center text-slate-400 text-sm font-medium">Aún no hay misiones. Crea la primera arriba.</Card>}
      {asgTask && <AssignModal ctx={ctx} task={asgTask} onClose={() => setAsgTask(null)} />}
      {recTask && <RecurringModal ctx={ctx} task={recTask} onClose={() => setRecTask(null)} />}
    </div>
  );
}
