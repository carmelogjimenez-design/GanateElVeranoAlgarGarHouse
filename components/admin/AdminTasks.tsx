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
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const assign = async () => {
    const rows = sel.map((kid_id) => ({ task_id: task.id, kid_id, title: task.title, points: task.points, photo_required: task.photo_required, due_date: due, team_id: db.kids.find((k) => k.id === kid_id)?.team_id ?? null }));
    const { error } = await sb.from("assignments").insert(rows);
    flash(error ? error.message : `Asignada a ${rows.length} hijo(s)`);
    if (!error) { refresh(); onClose(); }
  };
  return (
    <Modal title={`Asignar (una vez): ${task.title}`} onClose={onClose}>
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mb-3" />
      <div className="flex flex-wrap gap-2 mb-3">
        {db.teams.map((t) => <button key={t.id} onClick={() => { const ids = db.kids.filter((k) => k.team_id === t.id).map((k) => k.id); setSel((s) => [...new Set([...s, ...ids])]); }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white" style={{ background: t.color }}>+ {t.name}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {db.kids.map((k) => <button key={k.id} onClick={() => toggle(k.id)} className={`rounded-xl p-2 text-sm font-semibold border ${sel.includes(k.id) ? "border-brand bg-orange-50 text-navy" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{k.name}</button>)}
      </div>
      <Btn variant="primary" className="w-full" onClick={() => sel.length && assign()}>Asignar a {sel.length}</Btn>
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

      <div className="flex items-center justify-between mb-2 px-0.5">
        <h3 className="font-bold text-navy tracking-tight">Misiones ({db.tasks.length})</h3>
        <Btn variant="teal" className="text-sm py-2 flex items-center gap-1.5" onClick={generate}><CalendarClock size={15} /> Generar hoy</Btn>
      </div>
      <div className="space-y-2.5">
        {db.tasks.map((t) => {
          const Icon = missionIcon(t.title);
          const targets = db.task_targets.filter((tt) => tt.task_id === t.id).length;
          return (
            <Card key={t.id} className="p-3.5">
              <div className="flex items-center gap-3">
                <IconTile color="#0B1F3A"><Icon size={18} /></IconTile>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy truncate">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.frequency} · {t.difficulty}{t.photo_required ? " · foto" : ""}{targets ? ` · recurrente (${targets})` : ""}</div>
                </div>
                <Chip tone="brand">+{t.points}</Chip>
              </div>
              <div className="flex gap-2 mt-3">
                <Btn variant="ghost" className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5" onClick={() => setRecTask(t)}><Repeat size={15} /> Recurrente</Btn>
                <Btn variant="primary" className="flex-1 text-sm py-2" onClick={() => setAsgTask(t)}>Asignar una vez</Btn>
                <button onClick={async () => { await sb.from("tasks").delete().eq("id", t.id); refresh(); }} className="text-slate-300 hover:text-red-400 px-2"><Trash2 size={17} /></button>
              </div>
            </Card>
          );
        })}
      </div>
      {asgTask && <AssignModal ctx={ctx} task={asgTask} onClose={() => setAsgTask(null)} />}
      {recTask && <RecurringModal ctx={ctx} task={recTask} onClose={() => setRecTask(null)} />}
    </div>
  );
}
